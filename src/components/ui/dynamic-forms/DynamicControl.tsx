import { useFormContext } from 'react-hook-form';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';

import { DynamicFieldData } from './dynamic-control-types';

export const DynamicControl = ({
  inputType,
  fieldName,
  defaultValue,
  options = [],
  config = {},
}: DynamicFieldData) => {
  const { register } = useFormContext();

  switch (inputType) {
    case 'text':
      return (
        <Input
          type="text"
          placeholder={fieldName}
          {...register(fieldName, config)}
          defaultValue={defaultValue}
        />
      );
    case 'number':
      return (
        <Input
          type="number"
          {...register(fieldName, config)}
          defaultValue={defaultValue}
        />
      );
    case 'select':
      return (
        // TODO: create a select
        <select
          {...register(fieldName, config)}
          defaultValue={defaultValue}
          name={fieldName}
          id={fieldName}
        >
          {options.map((o, index) => (
            <option key={index} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    case 'radio':
      return (
        <RadioGroup
          {...register(fieldName, config)}
          defaultValue={defaultValue}
          name={fieldName}
          id={fieldName}
          className="flex items-center space-x-2"
        >
          {options.map((o, index) => (
            <>
              <Label htmlFor={o.label}>{o.label}</Label>
              <RadioGroupItem key={index} value={o.value}>
                {o.label}
              </RadioGroupItem>
            </>
          ))}
        </RadioGroup>
      );
    default:
      return (
        <Input
          type="text"
          {...register(fieldName, config)}
          defaultValue={defaultValue}
        />
      );
  }
};
