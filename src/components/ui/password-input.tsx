"use client"

import {
    Box,
    IconButton,
    Input,
    type InputProps,
    mergeRefs,
    useControllableState,
} from "@chakra-ui/react"
import * as React from "react"
import { LuEye, LuEyeOff } from "react-icons/lu"
import { InputGroup } from "./input-group"

export interface PasswordInputProps extends InputProps {
    rootProps?: React.ComponentProps<typeof InputGroup>
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
    function PasswordInput(props, ref) {
        const { rootProps, ...rest } = props
        const [visible, setVisible] = useControllableState({ defaultValue: false })
        const inputRef = React.useRef<HTMLInputElement>(null)

        return (
            <InputGroup
                width="full"
                endElement={
                    <VisibilityTrigger
                        disabled={rest.disabled}
                        onPointerDown={(e) => {
                            if (rest.disabled) return
                            if (e.button !== 0) return
                            e.preventDefault()
                            setVisible(!visible)
                        }}
                    >
                        {visible ? <LuEyeOff /> : <LuEye />}
                    </VisibilityTrigger>
                }
                {...rootProps}
            >
                <Input
                    {...rest}
                    ref={mergeRefs(ref, inputRef)}
                    type={visible ? "text" : "password"}
                />
            </InputGroup>
        )
    },
)

const VisibilityTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(function VisibilityTrigger(props, ref) {
    return (
        <IconButton
            tabIndex={-1}
            ref={ref}
            me="-2"
            aspectRatio="square"
            size="sm"
            variant="ghost"
            height="calc(100% - var(--input-height) / 4)"
            aria-label="Toggle password visibility"
            {...props}
        />
    )
})
