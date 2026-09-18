import React from 'react';
export const Icon = ({ children, size = 32, width, height, title, ...props }) => {
    return (React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: width || size, height: height || size, viewBox: "0 0 32 32", ...props },
        title && React.createElement("title", null, title),
        children));
};
//# sourceMappingURL=Icon.js.map