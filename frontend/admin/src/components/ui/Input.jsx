import React, { forwardRef } from 'react';
import classNames from 'classnames';

/**
 * Reusable Input component
 * @param {string} label - Input label
 * @param {string} error - Error message
 * @param {string} className - Additional classes
 * @param {object} props - Other input props
 */
const Input = forwardRef(({ label, error, className, id, ...props }, ref) => {
  const inputId = id || props.name;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={classNames(
          'block w-full rounded-md border-gray-300 shadow-sm sm:text-sm',
          'focus:border-indigo-500 focus:ring-indigo-500',
          { 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500': error },
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
