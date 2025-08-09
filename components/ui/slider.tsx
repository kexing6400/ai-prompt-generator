/**
 * Slider组件 - 用于参数调节
 * 支持范围选择和实时数值显示
 */

import React from 'react';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
  description?: string;
  className?: string;
  showValue?: boolean;
  disabled?: boolean;
}

export function Slider({
  value,
  onChange,
  min,
  max,
  step = 0.1,
  label,
  description,
  className = '',
  showValue = true,
  disabled = false
}: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-700">
            {label}
          </label>
          {showValue && (
            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
              {value}
            </span>
          )}
        </div>
      )}
      
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`
          }}
        />
        
        {/* 刻度线 */}
        <div className="flex justify-between mt-1 text-xs text-gray-400">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
      
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
      
      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          height: 18px;
          width: 18px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: all 0.2s ease;
        }
        
        .slider-thumb::-webkit-slider-thumb:hover {
          background: #2563eb;
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        
        .slider-thumb::-moz-range-thumb {
          height: 18px;
          width: 18px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}