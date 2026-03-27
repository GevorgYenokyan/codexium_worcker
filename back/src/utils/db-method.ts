import { HttpException, HttpStatus } from '@nestjs/common';

class DbMethods {
  static async getById(model, id, optionCb = (opts: any) => opts) {
    let options = { where: { id } };
    options = optionCb(options);

    try {
      const data = await model.findOne(options);
      if (!data) {
        throw new HttpException('not found', HttpStatus.NOT_FOUND);
      }
      return { error: false, message: data };
    } catch (e) {
      throw new HttpException('BAD REQUEST', HttpStatus.BAD_REQUEST);
    }
  }

  //   static async removeById(model, id) {
  //     try {
  //       const data = model.findOne({ where: { id } });
  //       if (data) {
  //         const results:any = model.destroy({
  //           where: { id },
  //         });

  //         return { error: false, message: { message: 'deleted', info: results } };
  //       } else {
  //         return {
  //           error: false,
  //           message: { message: 'cleared', info: results },
  //           status: 404,
  //         };
  //       }
  //     } catch (e) {
  //       throw new HttpException('BAD REQUEST', HttpStatus.BAD_REQUEST);
  //     }
  //   }
}

export default DbMethods;
