import { FormProvider, useForm } from 'react-hook-form';
import { Button } from '~/components/ui/button';
import { DynamicControl } from '~/components/ui/dynamic-forms/DynamicControl';
import { DynamicFieldData } from '~/components/ui/dynamic-forms/dynamic-control-types';
import { Label } from '~/components/ui/label';

interface FormProps {
  fields: DynamicFieldData[];
  onSubmit: any;
}

export const DynamicForm = ({ fields, onSubmit }: FormProps) => {
  const formMethods = useForm();
  const handleSubmit = (data, e) => {
    console.log(data);
    onSubmit(data, e);
  };
  const onError = (errors, e) => console.log(errors, e);

  return (
    <form onSubmit={formMethods.handleSubmit(handleSubmit, onError)}>
      <FormProvider {...formMethods}>
        {fields.map((d, i) => (
          <div key={i} className="grid grid-cols-2 w-full items-center gap-1.5">
            <Label htmlFor={d.fieldName} className="col-start-1">
              {d.label}
            </Label>
            <div className="col-start-2">
              <DynamicControl {...d} />
            </div>
          </div>
        ))}
      </FormProvider>
      <Button type="submit">Submit</Button>
    </form>
  );
};
