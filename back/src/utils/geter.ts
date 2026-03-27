import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { FindOptions, Op } from 'sequelize';
import { Request } from 'express';

interface PaginationResponse {
  error: boolean;
  message: any;
  data?: any[];
  count?: number;
  currentPage?: number;
  limit?: number;
  isLastPage?: boolean;
  pages?: number[];
}

const SECURITY_CONFIG = {
  MAX_LIMIT: 1000,
  DEFAULT_LIMIT: 10,
  MAX_PAGE: 100000,
  MAX_SEARCH_LENGTH: 500,
  ENABLE_STRICT_MODE: false,
};

interface GetterConfig {
  searchableFields?: string[];
  sortableFields?: string[];
  filterableFields?: string[];
  maxLimit?: number;
  enableStrictMode?: boolean;
}

function safeJsonParse(value: any, fieldName: string): any {
  if (typeof value === 'object' && value !== null) {
    return value;
  }

  try {
    return JSON.parse(String(value));
  } catch (e) {
    throw new HttpException(
      `Invalid ${fieldName} format`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

function isDangerousKey(key: string): boolean {
  const dangerous = ['__proto__', 'constructor', 'prototype'];
  return dangerous.includes(key) || key.startsWith('$') || key.includes('.');
}

function validateSearchLength(value: string, maxLength: number): void {
  if (value.length > maxLength) {
    throw new HttpException('Search term too long', HttpStatus.BAD_REQUEST);
  }
}

function hasSequelizeOperators(obj: any): boolean {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const keys = Object.keys(obj);
  return keys.some((key) => {
    if (key.startsWith('$')) {
      return true;
    }
    if (typeof Symbol !== 'undefined') {
      const symbols = Object.getOwnPropertySymbols(obj);
      return symbols.some((sym) => sym.toString().includes('$'));
    }
    return false;
  });
}

export async function getter(
  model: any,
  req: Request,
  optionCb: (opts: FindOptions) => FindOptions = (opts) => opts,
  config: GetterConfig = {},
): Promise<any> {
  const logger = new Logger('Getter');

  try {
    let options: FindOptions = { where: {} };
    let page = 0;
    let limit = SECURITY_CONFIG.DEFAULT_LIMIT;
    let offset = 0;

    const maxLimit = config.maxLimit ?? SECURITY_CONFIG.MAX_LIMIT;
    const strictMode =
      config.enableStrictMode ?? SECURITY_CONFIG.ENABLE_STRICT_MODE;

    const searchableFieldsSet = config.searchableFields
      ? new Set(config.searchableFields)
      : null;
    const sortableFieldsSet = config.sortableFields
      ? new Set(config.sortableFields)
      : null;
    const filterableFieldsSet = config.filterableFields
      ? new Set(config.filterableFields)
      : null;

    // Создаем where объект один раз
    const whereClause: any = {};

    // ===== LIMIT =====
    const reqLimit = req.query.limit ?? req.body.limit;
    if (reqLimit !== undefined && reqLimit !== null && reqLimit !== '') {
      const parsedLimit = parseInt(String(reqLimit), 10);

      if (isNaN(parsedLimit) || parsedLimit <= 0) {
        throw new HttpException(
          'Limit must be a positive number',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (parsedLimit > maxLimit) {
        logger.warn(
          `Limit ${parsedLimit} exceeds maximum ${maxLimit}, capping to ${maxLimit}`,
        );
        limit = maxLimit;
      } else {
        limit = parsedLimit;
      }
    }
    options.limit = limit;

    // ===== PAGE =====
    const reqPage = req.query.page ?? req.body.page;
    if (reqPage !== undefined && reqPage !== null && reqPage !== '') {
      const parsedPage = parseInt(String(reqPage), 10) - 1;

      if (isNaN(parsedPage) || parsedPage < 0) {
        throw new HttpException(
          'Page must be a non-negative number',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (parsedPage > SECURITY_CONFIG.MAX_PAGE) {
        throw new HttpException(
          'Page number too large',
          HttpStatus.BAD_REQUEST,
        );
      }

      page = parsedPage;
      offset = page * limit;
    }
    options.offset = offset;

    // ===== FILTER =====
    const reqFilter = req.query.filter ?? req.body.filter;
    if (reqFilter !== undefined && reqFilter !== null) {
      const filter = safeJsonParse(reqFilter, 'filter');

      if (filter && typeof filter === 'object' && !Array.isArray(filter)) {
        for (const key of Object.keys(filter)) {
          if (isDangerousKey(key)) {
            logger.warn(`Blocked dangerous filter key: ${key}`);
            if (strictMode) {
              throw new HttpException(
                'Invalid filter key',
                HttpStatus.BAD_REQUEST,
              );
            }
            continue;
          }

          if (filterableFieldsSet !== null && !filterableFieldsSet.has(key)) {
            logger.warn(`Field "${key}" not in filterable whitelist`);
            if (strictMode) {
              throw new HttpException(
                `Field "${key}" is not filterable`,
                HttpStatus.BAD_REQUEST,
              );
            }
            continue;
          }

          const value = filter[key];

          if (
            typeof value === 'object' &&
            value !== null &&
            !Array.isArray(value)
          ) {
            if (hasSequelizeOperators(value)) {
              logger.warn(
                `Blocked Sequelize operator in filter for key: ${key}`,
              );
              if (strictMode) {
                throw new HttpException(
                  'Operators not allowed in filter',
                  HttpStatus.BAD_REQUEST,
                );
              }
              continue;
            }
          }

          whereClause[key] = value;
        }
      }
    }

    // ===== BETWEEN =====
    const reqBetween = req.query.between ?? req.body.between;
    if (reqBetween !== undefined && reqBetween !== null) {
      const between = safeJsonParse(reqBetween, 'between');

      if (between && typeof between === 'object') {
        for (const key of Object.keys(between)) {
          if (isDangerousKey(key)) {
            logger.warn(`Blocked dangerous between key: ${key}`);
            continue;
          }

          if (filterableFieldsSet !== null && !filterableFieldsSet.has(key)) {
            logger.warn(
              `Field "${key}" not in filterable whitelist for between`,
            );
            if (strictMode) {
              throw new HttpException(
                `Field "${key}" is not filterable`,
                HttpStatus.BAD_REQUEST,
              );
            }
            continue;
          }

          const betweenValue = between[key];
          if (!betweenValue || typeof betweenValue !== 'object') {
            continue;
          }

          const { from, to } = betweenValue;

          const isValidFrom =
            from === undefined ||
            from === null ||
            typeof from === 'number' ||
            typeof from === 'string' ||
            from instanceof Date;
          const isValidTo =
            to === undefined ||
            to === null ||
            typeof to === 'number' ||
            typeof to === 'string' ||
            to instanceof Date;

          if (!isValidFrom || !isValidTo) {
            logger.warn(`Invalid between values for ${key}`);
            continue;
          }

          if (
            from !== undefined &&
            from !== null &&
            to !== undefined &&
            to !== null
          ) {
            whereClause[key] = { [Op.between]: [from, to] };
          } else if (from !== undefined && from !== null) {
            whereClause[key] = { [Op.gte]: from };
          } else if (to !== undefined && to !== null) {
            whereClause[key] = { [Op.lte]: to };
          }
        }
      }
    }

    // ===== SEARCH =====
    const reqSearch = req.query.search ?? req.body.search;
    if (reqSearch !== undefined && reqSearch !== null) {
      const search = safeJsonParse(reqSearch, 'search');

      if (search && typeof search === 'object') {
        for (const key of Object.keys(search)) {
          if (isDangerousKey(key)) {
            logger.warn(`Blocked dangerous search key: ${key}`);
            continue;
          }

          if (searchableFieldsSet !== null && !searchableFieldsSet.has(key)) {
            logger.warn(`Field "${key}" not in searchable whitelist`);
            if (strictMode) {
              throw new HttpException(
                `Field "${key}" is not searchable`,
                HttpStatus.BAD_REQUEST,
              );
            }
            continue;
          }

          const searchValue = search[key];
          if (searchValue === undefined || searchValue === null) {
            continue;
          }

          const searchString = String(searchValue);
          validateSearchLength(searchString, SECURITY_CONFIG.MAX_SEARCH_LENGTH);

          whereClause[key] = { [Op.like]: `%${searchString}%` };
        }
      }
    }

    // ===== SORT =====
    const reqSort = req.query.sort ?? req.body.sort;
    if (reqSort !== undefined && reqSort !== null) {
      const sortParsed = safeJsonParse(reqSort, 'sort');

      if (Array.isArray(sortParsed)) {
        if (sortParsed.length !== 2) {
          throw new HttpException(
            'Sort must be an array of [field, order]',
            HttpStatus.BAD_REQUEST,
          );
        }

        const [field, order] = sortParsed;

        if (typeof field !== 'string' || field.trim() === '') {
          throw new HttpException(
            'Sort field must be a non-empty string',
            HttpStatus.BAD_REQUEST,
          );
        }

        if (!/^[a-zA-Z0-9_]+$/.test(field)) {
          throw new HttpException(
            'Invalid sort field name',
            HttpStatus.BAD_REQUEST,
          );
        }

        if (sortableFieldsSet !== null && !sortableFieldsSet.has(field)) {
          logger.warn(`Field "${field}" not in sortable whitelist`);
          if (strictMode) {
            throw new HttpException(
              `Field "${field}" is not sortable`,
              HttpStatus.BAD_REQUEST,
            );
          }
        } else {
          const orderStr = String(order).toUpperCase();
          if (!['ASC', 'DESC'].includes(orderStr)) {
            throw new HttpException(
              'Sort order must be ASC or DESC',
              HttpStatus.BAD_REQUEST,
            );
          }

          options.order = [[field, orderStr]];
        }
      }
    }

    // ===== ID =====
    const reqId = req.query.id ?? req.body.id;
    if (reqId !== undefined && reqId !== null && reqId !== '') {
      const id = parseInt(String(reqId), 10);
      if (isNaN(id) || id <= 0) {
        throw new HttpException('Invalid ID parameter', HttpStatus.BAD_REQUEST);
      }
      whereClause.id = id;
    }

    // Устанавливаем where в options
    options.where = whereClause;

    // Применяем кастомные опции
    options = optionCb(options);

    // Выполняем запрос
    const data = await model.findAndCountAll(options);
    const count = data.count;

    // Формируем ответ
    page += 1;
    const pageCount = count > 0 ? Math.ceil(count / limit) : 0;
    const isLastPage = pageCount === 0 || page >= pageCount;

    const MAX_PAGES_IN_RESPONSE = 100;
    const pagesArray =
      pageCount > 0 && pageCount <= MAX_PAGES_IN_RESPONSE
        ? Array.from({ length: pageCount }, (_, i) => i + 1)
        : [];

    return {
      error: false,
      message: data.rows,
      count,
      currentPage: page,
      limit,
      isLastPage,
      pages: pagesArray,
    };
  } catch (e) {
    if (e instanceof HttpException) {
      throw e;
    }

    logger.error(`Database query error: ${e.message}`, e.stack);
    return { error: true, message: e.message };
  }
}

// import { HttpException, HttpStatus } from '@nestjs/common';
// import { FindOptions, Model, Op, where } from 'sequelize';
// import { Request } from 'express';

// interface PaginationResponse {
//   error: boolean;
//   message: any;
//   data?: any[];
//   pageCount?: number;
//   currentPage?: number;
//   limit?: number;
//   isLastPage?: boolean;
//   pages?: number[];
// }

// export async function getter(
//   model,
//   req: Request,
//   optionCb: (opts: FindOptions) => FindOptions = (opts) => opts,
// ): Promise<any> {
//   try {
//     let options: FindOptions = { where: {} };
//     let page = 0;
//     let limit = 10;
//     let offset = 0;

//     // Parse limit
//     const reqLimit = req.query.limit || req.body.limit;
//     if (reqLimit) {
//       limit = parseInt(reqLimit as string, 10);
//       if (isNaN(limit) || limit <= 0) {
//         throw new HttpException(
//           'Limit must be a positive number',
//           HttpStatus.BAD_REQUEST,
//         );
//       }
//     }
//     options.limit = limit;

//     // Parse page
//     const reqPage = req.query.page || req.body.page;
//     if (reqPage) {
//       page = parseInt(reqPage as string, 10) - 1;
//       if (isNaN(page) || page < 0) {
//         throw new HttpException(
//           'Page must be a non-negative number',
//           HttpStatus.BAD_REQUEST,
//         );
//       }
//       offset = page * limit;
//     }
//     options.offset = offset;

//     // Parse filters
//     const reqFilter = req.query.filter || req.body.filter;
//     if (reqFilter) {
//       try {
//         const filter =
//           typeof reqFilter === 'object'
//             ? reqFilter
//             : JSON.parse(reqFilter as string);
//         options.where = { ...options.where, ...filter };
//       } catch (e) {
//         throw new HttpException(
//           'Invalid filter format: ' + e.message,
//           HttpStatus.BAD_REQUEST,
//         );
//       }
//     }

//     // Parse between filters
//     let between = req.query.between || req.body.between;
//     if (between) {
//       try {
//         between =
//           typeof between === 'object' ? between : JSON.parse(between as string);
//         for (const key in between) {
//           const { from, to } = between[key];
//           options.where = {
//             ...options.where,
//             [key]:
//               from && to
//                 ? { [Op.between]: [from, to] }
//                 : from
//                   ? { [Op.gte]: from }
//                   : { [Op.lte]: to },
//           };
//         }
//       } catch (e) {
//         throw new HttpException(
//           'Invalid between format: ' + e.message,
//           HttpStatus.BAD_REQUEST,
//         );
//       }
//     }

//     // Parse search query
//     const reqSearch = req.query.search || req.body.search;
//     if (reqSearch) {
//       try {
//         const search =
//           typeof reqSearch === 'object'
//             ? reqSearch
//             : JSON.parse(reqSearch as string);
//         for (const key in search) {
//           options.where = {
//             ...options.where,
//             [key]: { [Op.like]: `%${search[key]}%` },
//           };
//         }
//       } catch (e) {
//         throw new HttpException(
//           'Invalid search format: ' + e.message,
//           HttpStatus.BAD_REQUEST,
//         );
//       }
//     }

//     // Parse sorting
//     const sort = req.query.sort || req.body.sort;
//     if (sort) {
//       try {
//         options.order = [JSON.parse(sort as string)];
//       } catch (e) {
//         throw new HttpException(
//           'Invalid sort format: ' + e.message,
//           HttpStatus.BAD_REQUEST,
//         );
//       }
//     }

//     // Parse ID
//     const reqId = req.query.id || req.body.id;
//     if (reqId) {
//       options.where = { ...options.where, id: reqId };
//     }

//     // Apply custom options callback
//     options = optionCb(options);
//     const count = await model.count({ where: options.where });
//     // Fetch data using findAndCountAll
//     const data = await model.findAndCountAll(options);

//     // Add pagination metadata
//     page += 1;
//     // const count = Math.ceil(data.count);
//     const isLastPage = page === count / limit;

//     return {
//       error: false,
//       message: data.rows,
//       count,
//       currentPage: page,
//       limit,
//       isLastPage,
//       pages: Array.from({ length: count / limit }, (_, i) => i + 1),
//     };
//   } catch (e) {
//     return { error: true, message: e.message };
//   }
// }
//////PROTECT VERSION////////
// import { HttpException, HttpStatus } from '@nestjs/common';
// import { FindOptions, Op } from 'sequelize';
// import { Request } from 'express';

// /* ================= CONFIG ================= */

// const DEFAULT_LIMIT = 10;
// const MAX_LIMIT = 100;

// const ALLOWED_FILTER_FIELDS = ['name', 'status'];
// const ALLOWED_SEARCH_FIELDS = ['name'];
// const ALLOWED_SORT_FIELDS = ['id', 'createdAt'];

// /* ========================================== */

// export async function secureGetter(
//   model: any,
//   req: Request,
//   optionCb: (opts: FindOptions) => FindOptions = (opts) => opts,
// ): Promise<any> {
//   try {
//     const options: FindOptions = {
//       where: {},
//       limit: DEFAULT_LIMIT,
//       offset: 0,
//     };

//     /* ---------- LIMIT ---------- */
//     const rawLimit = Number(req.query.limit);
//     if (!isNaN(rawLimit)) {
//       if (rawLimit <= 0 || rawLimit > MAX_LIMIT) {
//         throw new HttpException(
//           `Limit must be between 1 and ${MAX_LIMIT}`,
//           HttpStatus.BAD_REQUEST,
//         );
//       }
//       options.limit = rawLimit;
//     }

//     /* ---------- PAGE ---------- */
//     const rawPage = Number(req.query.page);
//     const page = !isNaN(rawPage) && rawPage > 0 ? rawPage : 1;
//     options.offset = (page - 1) * options.limit;

//     /* ---------- FILTER ---------- */
//     if (req.query.filter) {
//       const filter =
//         typeof req.query.filter === 'object'
//           ? req.query.filter
//           : JSON.parse(req.query.filter as string);

//       for (const key of Object.keys(filter)) {
//         if (!ALLOWED_FILTER_FIELDS.includes(key)) {
//           throw new HttpException(
//             `Filtering by "${key}" is not allowed`,
//             HttpStatus.BAD_REQUEST,
//           );
//         }
//         options.where[key] = filter[key];
//       }
//     }

//     /* ---------- SEARCH ---------- */
//     if (req.query.search) {
//       const search =
//         typeof req.query.search === 'object'
//           ? req.query.search
//           : JSON.parse(req.query.search as string);

//       for (const key of Object.keys(search)) {
//         if (!ALLOWED_SEARCH_FIELDS.includes(key)) {
//           throw new HttpException(
//             `Search by "${key}" is not allowed`,
//             HttpStatus.BAD_REQUEST,
//           );
//         }

//         const value = String(search[key]).trim();

//         if (value.length < 2 || value.length > 50) {
//           throw new HttpException(
//             'Search value length must be between 2 and 50 characters',
//             HttpStatus.BAD_REQUEST,
//           );
//         }

//         options.where[key] = {
//           [Op.like]: `%${value}%`,
//         };
//       }
//     }

//     /* ---------- SORT ---------- */
//     if (req.query.sort) {
//       const [field, direction] = JSON.parse(req.query.sort as string);

//       if (!ALLOWED_SORT_FIELDS.includes(field)) {
//         throw new HttpException(
//           `Sorting by "${field}" is not allowed`,
//           HttpStatus.BAD_REQUEST,
//         );
//       }

//       options.order = [[field, direction === 'DESC' ? 'DESC' : 'ASC']];
//     }

//     /* ---------- TENANT / SCOPE ENFORCEMENT ---------- */
//     if ((req as any).user?.tenantId) {
//       options.where['tenantId'] = (req as any).user.tenantId;
//     }

//     /* ---------- CUSTOM OPTIONS ---------- */
//     options = optionCb(options);

//     /* ---------- QUERY ---------- */
//     const { count, rows } = await model.findAndCountAll(options);

//     const totalPages = Math.ceil(count / options.limit);

//     return {
//       error: false,
//       data: rows,
//       meta: {
//         count,
//         page,
//         limit: options.limit,
//         totalPages,
//         isLastPage: page >= totalPages,
//       },
//     };
//   } catch (e) {
//     throw new HttpException(
//       e.message || 'Invalid request',
//       e.status || HttpStatus.BAD_REQUEST,
//     );
//   }
// }

//--------------End----------------

////
////
/////
// import { HttpException, HttpStatus } from '@nestjs/common';
// import { FindOptions, Op } from 'sequelize';
// import { Request } from 'express';
// import { Cache } from 'cache-manager';
// import { createHash } from 'crypto';

// export async function getter(
//   model,
//   req: Request,
//   optionCb: (opts: FindOptions) => FindOptions = (opts) => opts,
//   cacheManager?: Cache,
//   cacheTTL = 60,
// ): Promise<any> {
//   try {
//     let options: FindOptions = { where: {} };
//     let page = 0;
//     let limit = 10;
//     let offset = 0;

//     const reqLimit = req.query.limit || req.body.limit;
//     if (reqLimit) {
//       limit = parseInt(reqLimit as string, 10);
//       if (isNaN(limit) || limit <= 0)
//         throw new HttpException(
//           'Limit must be positive',
//           HttpStatus.BAD_REQUEST,
//         );
//     }
//     options.limit = limit;

//     const reqPage = req.query.page || req.body.page;
//     if (reqPage) {
//       page = parseInt(reqPage as string, 10) - 1;
//       if (isNaN(page) || page < 0)
//         throw new HttpException('Page must be >= 1', HttpStatus.BAD_REQUEST);
//       offset = page * limit;
//     }
//     options.offset = offset;

//     const reqFilter = req.query.filter || req.body.filter;
//     if (reqFilter) {
//       const filter =
//         typeof reqFilter === 'object'
//           ? reqFilter
//           : JSON.parse(reqFilter as string);
//       options.where = { ...options.where, ...filter };
//     }

//     const reqSearch = req.query.search || req.body.search;
//     if (reqSearch) {
//       const search =
//         typeof reqSearch === 'object'
//           ? reqSearch
//           : JSON.parse(reqSearch as string);
//       for (const key in search) {
//         options.where = {
//           ...options.where,
//           [key]: { [Op.like]: `%${search[key]}%` },
//         };
//       }
//     }

//     const sort = req.query.sort || req.body.sort;
//     if (sort) {
//       options.order = [JSON.parse(sort as string)];
//     }

//     const reqId = req.query.id || req.body.id;
//     if (reqId) options.where = { ...options.where, id: reqId };

//     options = optionCb(options);

//     // --- Redis Cache ---
//     if (cacheManager && req.query.noCache !== 'true') {
//       const prefix = `getter_${model.name || req.baseUrl}_`;
//       const hash = createHash('md5')
//         .update(
//           `${req.baseUrl}${JSON.stringify(req.query)}${JSON.stringify(req.body)}`,
//         )
//         .digest('hex');
//       const cacheKey = `${prefix}${hash}`;

//       const cached = await cacheManager.get(cacheKey);
//       if (cached) {
//         return cached;
//       }

//       const count = await model.count({ where: options.where });
//       const data = await model.findAndCountAll(options);

//       const totalPages = Math.ceil(count / limit);
//       page += 1;
//       const isLastPage = page >= totalPages;

//       const result = {
//         error: false,
//         message: data.rows,
//         count,
//         currentPage: page,
//         limit,
//         isLastPage,
//         pages: Array.from({ length: totalPages }, (_, i) => i + 1),
//       };

//       await cacheManager.set(cacheKey, result, cacheTTL);
//       return result;
//     }

//     // --- no Redis ---
//     const count = await model.count({ where: options.where });
//     const data = await model.findAndCountAll(options);
//     const totalPages = Math.ceil(count / limit);
//     page += 1;
//     const isLastPage = page >= totalPages;

//     return {
//       error: false,
//       message: data.rows,
//       count,
//       currentPage: page,
//       limit,
//       isLastPage,
//       pages: Array.from({ length: totalPages }, (_, i) => i + 1),
//     };
//   } catch (e) {
//     return { error: true, message: e.message };
//   }
// }

////////////
//////////
//////////////

// import { HttpException, HttpStatus } from '@nestjs/common';
// import { FindOptions, Model, Op, where } from 'sequelize';
// import { Request } from 'express';

// interface PaginationResponse {
//   error: boolean;
//   message: any;
//   data?: any[];
//   pageCount?: number;
//   currentPage?: number;
//   limit?: number;
//   isLastPage?: boolean;
//   pages?: number[];
// }

// export async function getter(
//   model,
//   req: Request,
//   optionCb: (opts: FindOptions) => FindOptions = (opts) => opts,
// ): Promise<any> {
//   try {
//     let options: FindOptions = { where: {} };
//     let page = 0;
//     let limit = 10;
//     let offset = 0;

//     // Parse limit
//     const reqLimit = req.query.limit || req.body.limit;
//     if (reqLimit) {
//       limit = parseInt(reqLimit as string, 10);
//       if (isNaN(limit) || limit <= 0) {
//         throw new HttpException(
//           'Limit must be a positive number',
//           HttpStatus.BAD_REQUEST,
//         );
//       }
//     }
//     options.limit = limit;

//     // Parse page
//     const reqPage = req.query.page || req.body.page;
//     if (reqPage) {
//       page = parseInt(reqPage as string, 10) - 1;
//       if (isNaN(page) || page < 0) {
//         throw new HttpException(
//           'Page must be a non-negative number',
//           HttpStatus.BAD_REQUEST,
//         );
//       }
//       offset = page * limit;
//     }
//     options.offset = offset;

//     // Parse filters
//     const reqFilter = req.query.filter || req.body.filter;
//     if (reqFilter) {
//       try {
//         const filter =
//           typeof reqFilter === 'object'
//             ? reqFilter
//             : JSON.parse(reqFilter as string);
//         options.where = { ...options.where, ...filter };
//       } catch (e) {
//         throw new HttpException(
//           'Invalid filter format: ' + e.message,
//           HttpStatus.BAD_REQUEST,
//         );
//       }
//     }

//     // Parse between filters
//     let between = req.query.between || req.body.between;
//     if (between) {
//       try {
//         between =
//           typeof between === 'object' ? between : JSON.parse(between as string);
//         for (const key in between) {
//           const { from, to } = between[key];
//           options.where = {
//             ...options.where,
//             [key]:
//               from && to
//                 ? { [Op.between]: [from, to] }
//                 : from
//                   ? { [Op.gte]: from }
//                   : { [Op.lte]: to },
//           };
//         }
//       } catch (e) {
//         throw new HttpException(
//           'Invalid between format: ' + e.message,
//           HttpStatus.BAD_REQUEST,
//         );
//       }
//     }

//     // Parse search query
//     const reqSearch = req.query.search || req.body.search;
//     if (reqSearch) {
//       try {
//         const search =
//           typeof reqSearch === 'object'
//             ? reqSearch
//             : JSON.parse(reqSearch as string);
//         for (const key in search) {
//           options.where = {
//             ...options.where,
//             [key]: { [Op.like]: `%${search[key]}%` },
//           };
//         }
//       } catch (e) {
//         throw new HttpException(
//           'Invalid search format: ' + e.message,
//           HttpStatus.BAD_REQUEST,
//         );
//       }
//     }

//     // Parse sorting
//     const sort = req.query.sort || req.body.sort;
//     if (sort) {
//       try {
//         options.order = [JSON.parse(sort as string)];
//       } catch (e) {
//         throw new HttpException(
//           'Invalid sort format: ' + e.message,
//           HttpStatus.BAD_REQUEST,
//         );
//       }
//     }

//     // Parse ID
//     const reqId = req.query.id || req.body.id;
//     if (reqId) {
//       options.where = { ...options.where, id: reqId };
//     }

//     // Apply custom options callback
//     options = optionCb(options);
//     const count = await model.count({ where: options.where });
//     // Fetch data using findAndCountAll
//     const data = await model.findAndCountAll(options);

//     // Add pagination metadata
//     page += 1;
//     // const count = Math.ceil(data.count);
//     const isLastPage = page === count / limit;

//     return {
//       error: false,
//       message: data.rows,
//       count,
//       currentPage: page,
//       limit,
//       isLastPage,
//       pages: Array.from({ length: count / limit }, (_, i) => i + 1),
//     };
//   } catch (e) {
//     return { error: true, message: e.message };
//   }
// }
