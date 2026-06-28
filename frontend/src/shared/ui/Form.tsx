/* eslint-disable react-refresh/only-export-components */
import React, { useState, FormEvent, ChangeEvent } from 'react';
import { cn } from '@/shared/lib/cn';
import { Input } from './Input';
import { Button } from './Button';

export interface UseFormProps<Values> {
    initialValues: Values;
    validate?: (values: Values) => Partial<Record<keyof Values, string>>;
    onSubmit: (values: Values) => Promise<void>;
    onSuccess?: () => void;
}

export function useForm<Values extends Record<string, any>>({
    initialValues,
    validate,
    onSubmit,
    onSuccess
}: UseFormProps<Values>) {
    const [values, setValues] = useState<Values>(initialValues);
    const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        let finalValue: any = value;
        if (type === 'checkbox') {
            finalValue = (e.target as HTMLInputElement).checked;
        }

        setValues(prev => ({
            ...prev,
            [name]: finalValue
        }));
        setIsDirty(true);
        
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    const setFieldValue = (name: keyof Values, value: any) => {
        setValues(prev => ({
            ...prev,
            [name]: value
        }));
        setIsDirty(true);

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    const handleSubmit = async (e?: FormEvent) => {
        if (e) e.preventDefault();

        if (validate) {
            const validationErrors = validate(values);
            const hasErrors = Object.values(validationErrors).some(err => !!err);
            if (hasErrors) {
                setErrors(validationErrors);
                return;
            }
        }

        setIsSubmitting(true);
        setSubmitSuccess(false);
        try {
            await onSubmit(values);
            setSubmitSuccess(true);
            setIsDirty(false);
            if (onSuccess) onSuccess();
        } catch (err: any) {
            console.error('Form submission failed:', err);
            setErrors(prev => ({
                ...prev,
                submit: err.message || 'Submission failed'
            }));
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setValues(initialValues);
        setErrors({});
        setIsDirty(false);
        setSubmitSuccess(false);
        setIsSubmitting(false);
    };

    return {
        values,
        errors,
        isSubmitting,
        isDirty,
        submitSuccess,
        handleChange,
        setFieldValue,
        handleSubmit,
        resetForm,
        setValues,
        setErrors
    };
}

// 1. FormField Primitives
interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    name: string;
    error?: string;
    required?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
    label,
    name,
    error,
    required = false,
    className,
    ...props
}) => {
    return (
        <div className={cn("space-y-1.5 w-full", className)}>
            {label && (
                <label htmlFor={name} className="block text-xs font-bold text-foreground uppercase tracking-wider">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <Input
                id={name}
                name={name}
                className={cn(error && "border-destructive/60 focus-visible:ring-destructive/20")}
                {...props}
            />
            {error && (
                <p className="text-[11px] font-semibold text-destructive animate-fade-in">
                    {error}
                </p>
            )}
        </div>
    );
};

// 2. FormError Primitive
export const FormError: React.FC<{ error?: string }> = ({ error }) => {
    if (!error) return null;
    return (
        <div className="p-3.5 border border-destructive/20 bg-destructive/10 text-destructive text-xs rounded-xl font-semibold animate-fade-in flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
        </div>
    );
};

// 3. SubmitButton Primitive
interface SubmitButtonProps {
    isSubmitting: boolean;
    isDirty?: boolean;
    children: React.ReactNode;
    className?: string;
    variant?: 'primary' | 'secondary' | 'danger' | 'outline';
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
    isSubmitting,
    isDirty = true,
    children,
    className,
    variant = 'primary'
}) => {
    return (
        <Button
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting || !isDirty}
            variant={variant}
            className={cn("w-full shadow-neon", className)}
        >
            {children}
        </Button>
    );
};
