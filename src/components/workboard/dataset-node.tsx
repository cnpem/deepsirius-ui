import { Handle, Position } from 'reactflow';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import { Input } from '~/components/ui/input';

export function DatasetNode() {
  return (
    <div>
      <Handle type="target" position={Position.Left} />
      <div className="flex h-full flex-col items-center justify-center">
        <div>{`I'm the old dataset`}</div>
      </div>
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Lets props!</AccordionTrigger>
          <AccordionContent>
            <div className="flex h-full flex-col items-center justify-center gap-1">
              <Input type="email" placeholder="Prop1" />
              <Input type="email" placeholder="Prop2" />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
