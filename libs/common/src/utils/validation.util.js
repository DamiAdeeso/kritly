"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatValidationErrors = formatValidationErrors;
exports.isValidEmail = isValidEmail;
exports.isValidPassword = isValidPassword;
exports.sanitizeInput = sanitizeInput;
function formatValidationErrors(errors) {
    const formattedErrors = [];
    function extractErrors(errors, prefix = '') {
        for (const error of errors) {
            const field = prefix ? `${prefix}.${error.property}` : error.property;
            if (error.constraints) {
                for (const constraint of Object.values(error.constraints)) {
                    formattedErrors.push(`${field}: ${constraint}`);
                }
            }
            if (error.children && error.children.length > 0) {
                extractErrors(error.children, field);
            }
        }
    }
    extractErrors(errors);
    return formattedErrors;
}
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function isValidPassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
}
function sanitizeInput(input) {
    return input.trim().replace(/[<>]/g, '');
}
