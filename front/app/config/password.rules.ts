export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const PASSWORD_RULES = [
    { test: /.{8,}/, label: "At least 8 characters" },
    { test: /[A-Z]/, label: "At least one uppercase Latin letter " },
    { test: /[a-z]/, label: "At least one lowercase Latin letter" },
    { test: /\d/, label: "At least one number" },
];
