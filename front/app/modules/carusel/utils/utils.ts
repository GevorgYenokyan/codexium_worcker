export const throttle = (func: Function, delay: number) => {
    let lastTime = 0;
    return (...args: any[]) => {
        const now = new Date().getTime();
        if (now - lastTime >= delay) {
            lastTime = now;
            func(...args);
        }
    };
};
