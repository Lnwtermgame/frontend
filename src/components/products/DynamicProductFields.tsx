"use client";

import { useState, useEffect } from "react";
import { motion } from "@/lib/framer-exports";
import { SeagmField, productApi } from "@/lib/services/product-api";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface DynamicProductFieldsProps {
  productId: string;
  onFieldsChange: (values: Record<string, string>, isValid: boolean) => void;
  onFieldsLoad?: (fields: SeagmField[], productType: string | null) => void;
  initialValues?: Record<string, string>;
  disabled?: boolean;
}

interface FieldState {
  fields: SeagmField[];
  productType: string | null;
  loading: boolean;
  error: string | null;
  fromCache: boolean;
}

export default function DynamicProductFields({
  productId,
  onFieldsChange,
  onFieldsLoad,
  initialValues = {},
  disabled = false,
}: DynamicProductFieldsProps) {
  const [state, setState] = useState<FieldState>({
    fields: [],
    productType: null,
    loading: true,
    error: null,
    fromCache: false,
  });

  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Fetch product fields on mount
  useEffect(() => {
    const fetchFields = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const response = await productApi.getProductFields(productId);

        if (!response.success) {
          throw new Error("Failed to load fields");
        }

        setState({
          fields: response.data.fields || [],
          productType: response.data.productType,
          loading: false,
          error: null,
          fromCache: response.data.fromCache,
        });

        // Notify parent
        onFieldsLoad?.(response.data.fields || [], response.data.productType);

        // Initialize values with empty strings for required fields
        const initialFieldValues: Record<string, string> = { ...initialValues };
        response.data.fields?.forEach((field: SeagmField) => {
          if (!(field.name in initialFieldValues)) {
            initialFieldValues[field.name] = "";
          }
        });
        setValues(initialFieldValues);

        // Validate initial values
        validateFields(initialFieldValues, response.data.fields || []);
      } catch (error: any) {
        console.error("[DynamicProductFields] Error:", error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error.message || "Failed to load product fields",
        }));
      }
    };

    fetchFields();
  }, [productId]);

  // Validate all fields
  const validateFields = (
    fieldValues: Record<string, string>,
    fields: SeagmField[]
  ): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach((field) => {
      const value = fieldValues[field.name];
      const isRequired = field.required !== false;

      if (isRequired && (!value || value.trim() === "")) {
        newErrors[field.name] = `${field.label} is required`;
      }
    });

    setErrors(newErrors);

    const isValid = Object.keys(newErrors).length === 0;
    onFieldsChange(fieldValues, isValid);

    return isValid;
  };

  // Handle field change
  const handleChange = (name: string, value: string) => {
    const newValues = { ...values, [name]: value };
    setValues(newValues);
    setTouched((prev) => ({ ...prev, [name]: true }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    validateFields(newValues, state.fields);
  };

  // Handle field blur
  const handleBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));

    // Validate on blur
    const field = state.fields.find((f) => f.name === name);
    if (field) {
      const value = values[name];
      const isRequired = field.required !== false;

      if (isRequired && (!value || value.trim() === "")) {
        setErrors((prev) => ({ ...prev, [name]: `${field.label} is required` }));
      }
    }
  };

  // Render text input
  const renderTextInput = (field: SeagmField) => {
    const hasError = touched[field.name] && errors[field.name];

    return (
      <div key={field.name} className="space-y-2">
        <label className="block text-sm font-medium text-white">
          {field.label}
          {field.required !== false && (
            <span className="text-red-400 ml-1">*</span>
          )}
        </label>
        {field.multiline ? (
          <textarea
            value={values[field.name] || ""}
            onChange={(e) => handleChange(field.name, e.target.value)}
            onBlur={() => handleBlur(field.name)}
            placeholder={field.placeholder}
            disabled={disabled}
            rows={3}
            className={`w-full bg-mali-card border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:outline-none transition-all resize-none ${
              hasError
                ? "border-red-500 focus:ring-red-500/20"
                : "border-mali-blue/20 focus:ring-mali-blue/50 focus:border-mali-blue"
            }`}
          />
        ) : (
          <div className="relative">
            {field.prefix && (
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                {field.prefix}
              </span>
            )}
            <input
              type="text"
              value={values[field.name] || ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
              onBlur={() => handleBlur(field.name)}
              placeholder={field.placeholder}
              disabled={disabled}
              className={`w-full bg-mali-card border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:outline-none transition-all ${
                field.prefix ? "pl-10" : ""
              } ${
                hasError
                  ? "border-red-500 focus:ring-red-500/20"
                  : "border-mali-blue/20 focus:ring-mali-blue/50 focus:border-mali-blue"
              }`}
            />
          </div>
        )}
        {hasError && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-sm flex items-center gap-1"
          >
            <AlertCircle className="w-4 h-4" />
            {errors[field.name]}
          </motion.p>
        )}
      </div>
    );
  };

  // Render select input
  const renderSelectInput = (field: SeagmField) => {
    const hasError = touched[field.name] && errors[field.name];
    const options = field.options || [];

    return (
      <div key={field.name} className="space-y-2">
        <label className="block text-sm font-medium text-white">
          {field.label}
          {field.required !== false && (
            <span className="text-red-400 ml-1">*</span>
          )}
        </label>
        <select
          value={values[field.name] || ""}
          onChange={(e) => handleChange(field.name, e.target.value)}
          onBlur={() => handleBlur(field.name)}
          disabled={disabled}
          className={`w-full bg-mali-card border rounded-lg px-4 py-3 text-white focus:ring-2 focus:outline-none transition-all appearance-none cursor-pointer ${
            hasError
              ? "border-red-500 focus:ring-red-500/20"
              : "border-mali-blue/20 focus:ring-mali-blue/50 focus:border-mali-blue"
          }`}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
            backgroundSize: "16px",
          }}
        >
          <option value="">{field.placeholder || "Select..."}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {hasError && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-sm flex items-center gap-1"
          >
            <AlertCircle className="w-4 h-4" />
            {errors[field.name]}
          </motion.p>
        )}

        {/* Render child fields if this field has children and a value is selected */}
        {values[field.name] &&
          options.map((option) => {
            if (
              option.value === values[field.name] &&
              option.child &&
              option.child.length > 0
            ) {
              return (
                <div key={`${field.name}-children`} className="mt-4 space-y-4">
                  {option.child.map((childField) => {
                    // Find the parent_value that matches current selection
                    const parentOptions = childField.options.find(
                      (opt) => opt.parent_value === option.value
                    );

                    if (!parentOptions?.child_options?.length) return null;

                    const childHasError =
                      touched[childField.name] && errors[childField.name];

                    return (
                      <div key={childField.name} className="space-y-2">
                        <label className="block text-sm font-medium text-white">
                          {childField.label}
                          <span className="text-red-400 ml-1">*</span>
                        </label>
                        <div className="relative">
                          {childField.prefix && (
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                              {childField.prefix}
                            </span>
                          )}
                          <select
                            value={values[childField.name] || ""}
                            onChange={(e) =>
                              handleChange(childField.name, e.target.value)
                            }
                            onBlur={() => handleBlur(childField.name)}
                            disabled={disabled}
                            className={`w-full bg-mali-card border rounded-lg px-4 py-3 text-white focus:ring-2 focus:outline-none transition-all appearance-none cursor-pointer ${
                              childField.prefix ? "pl-10" : ""
                            } ${
                              childHasError
                                ? "border-red-500 focus:ring-red-500/20"
                                : "border-mali-blue/20 focus:ring-mali-blue/50 focus:border-mali-blue"
                            }`}
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                              backgroundRepeat: "no-repeat",
                              backgroundPosition: "right 12px center",
                              backgroundSize: "16px",
                            }}
                          >
                            <option value="">Select {childField.label}...</option>
                            {parentOptions.child_options.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        {childHasError && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-red-400 text-sm flex items-center gap-1"
                          >
                            <AlertCircle className="w-4 h-4" />
                            {errors[childField.name]}
                          </motion.p>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            }
            return null;
          })}
      </div>
    );
  };

  // Render field based on type
  const renderField = (field: SeagmField) => {
    switch (field.type) {
      case "select":
        return renderSelectInput(field);
      case "text":
      default:
        return renderTextInput(field);
    }
  };

  if (state.loading) {
    return (
      <div className="bg-mali-card rounded-xl border border-mali-blue/20 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-mali-blue animate-spin" />
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="w-6 h-6" />
          <div>
            <p className="font-medium">Failed to load product fields</p>
            <p className="text-sm text-red-300">{state.error}</p>
          </div>
        </div>
      </div>
    );
  }

  // No fields required (CARD products or no fields configured)
  if (state.fields.length === 0) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
        <div className="flex items-center gap-3 text-green-400">
          <CheckCircle2 className="w-6 h-6" />
          <div>
            <p className="font-medium">
              {state.productType === "CARD"
                ? "No additional information required"
                : "Product ready"}
            </p>
            <p className="text-sm text-green-300">
              {state.productType === "CARD"
                ? "Gift card PIN will be delivered after payment."
                : "This product doesn't require any additional fields."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-mali-card rounded-xl border border-mali-blue/20 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          Required Information
        </h3>
        {state.fromCache && (
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Cached
          </span>
        )}
      </div>

      <div className="space-y-4">
        {state.fields.map((field) => (
          <motion.div
            key={field.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderField(field)}
          </motion.div>
        ))}
      </div>

      {/* Helper text for direct top-up */}
      {state.productType === "DIRECT_TOPUP" && (
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-300">
            <strong className="text-blue-200">Important:</strong> Please double-check
            your information before proceeding. Incorrect details may result in
            failed delivery.
          </p>
        </div>
      )}
    </div>
  );
}
