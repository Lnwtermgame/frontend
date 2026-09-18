import React from 'react';
export interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string;
    title?: string;
}
export declare const Icon: React.FC<IconProps>;
