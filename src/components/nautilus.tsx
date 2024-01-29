import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeftIcon,
  FileIcon,
  FolderIcon,
  LayoutGridIcon,
  LayoutListIcon,
} from 'lucide-react';
import { ArrowRightIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import { env } from '~/env.mjs';
import { cn, toUnixPath } from '~/lib/utils';
import { api } from '~/utils/api';

import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';

type Shortcut = {
  name: string;
  path: string;
};

const shortcuts: Shortcut[] = [
  {
    name: 'ibirá',
    path: env.NEXT_PUBLIC_STORAGE_PATH,
  },
  {
    name: 'home',
    path: '/ibira/lnls/labs/tepui/home',
  },
];

const FormSchema = z.object({
  path: z
    .string()
    .nonempty()
    .transform((v) => toUnixPath(v)),
});

type Display = 'grid' | 'list';

const Skeleton = () => {
  return (
    <div className="grid grid-cols-5 gap-x-1 gap-y-2 p-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i}>
          <div className="h-8 rounded-sm bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  );
};

export const NautilusDialog = ({
  trigger,
  onSelect,
}: {
  trigger: React.ReactNode;
  onSelect: (p: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const handleSelect = (p: string) => {
    onSelect(p);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="pt-12">
        <Nautilus onSelect={handleSelect} />
      </DialogContent>
    </Dialog>
  );
};

const Nautilus = ({ onSelect }: { onSelect: (p: string) => void }) => {
  const [path, setPath] = useState(env.NEXT_PUBLIC_STORAGE_PATH);
  const [history, setHistory] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState('');
  const [display, setDisplay] = useState<Display>('grid');

  const { data, isLoading, error } = api.ssh.ls.useQuery({ path });

  useEffect(() => {
    if (error) {
      toast.error(error.message);
      setPath(history.pop() ?? env.NEXT_PUBLIC_STORAGE_PATH);
    }
  }, [error, history]);

  const filteredData = data?.files.filter((item) =>
    item.name.toLowerCase().includes(search),
  );

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      path: path,
    },
  });

  useEffect(() => {
    if (data) {
      form.setValue('path', path);
      setSearch('');
      setSelected('');
    }
  }, [data, form, path]);

  function onSubmit(data: z.infer<typeof FormSchema>) {
    if (data.path === path) return;
    setHistory((prev) => [...prev, path]);
    setPath(data.path);
  }

  function handleSelect() {
    const p = `${path}/${selected}`;
    onSelect(p);
    toast.success(`Selected ${p}`);
  }

  const gridClass = 'grid grid-flow-row grid-cols-5 gap-1 p-2';
  const listClass = 'flex flex-col gap-1 p-2';

  return (
    <div className="flex flex-col gap-4">
      <div className="relative flex flex-row gap-0.5 items-center">
        <Button
          className="h-8"
          title="Go back"
          size="icon"
          variant="outline"
          disabled={history.length === 0}
          onClick={() => {
            const newHistory = [...history];
            const path = newHistory.pop();
            setHistory(newHistory);
            if (!path) return;
            setPath(path);
          }}
        >
          <ArrowLeftIcon className="w-4 h-4" />
        </Button>
        <span className="text-input">|</span>
        {shortcuts.map((shortcut) => (
          <Button
            key={shortcut.name}
            className=" h-8 text-xs"
            variant="outline"
            onClick={() => {
              if (shortcut.path === path) return;
              setHistory((prev) => [...prev, path]);
              setPath(shortcut.path);
            }}
          >
            {shortcut.name}
          </Button>
        ))}
        <span className="text-input">|</span>
        <Button
          className="h-8 absolute end-0 "
          title="Select"
          onClick={handleSelect}
        >
          Select
        </Button>
      </div>
      <Form {...form}>
        <form onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)}>
          <FormField
            control={form.control}
            name="path"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Path</FormLabel>
                <FormControl>
                  <div className="flex flex-row gap-0.5 items-center">
                    <Input className="text-ellipsis" {...field} />
                    <Button
                      type="submit"
                      size="icon"
                      variant="outline"
                      disabled={form.formState.isSubmitting}
                    >
                      <ArrowRightIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
                <FormDescription className="sr-only">
                  Enter a valid path to navigate to a folder
                </FormDescription>
              </FormItem>
            )}
          />
        </form>
      </Form>
      <hr />
      <div className="flex flex-row gap-2">
        <Input
          value={search}
          onChange={handleInput}
          placeholder="Search files and folders"
        />
        <Button
          title="Change layout"
          size="icon"
          variant="outline"
          onClick={() => setDisplay(display === 'grid' ? 'list' : 'grid')}
        >
          {display === 'grid' ? (
            <LayoutGridIcon className="w-4 h-4" />
          ) : (
            <LayoutListIcon className="w-4 h-4" />
          )}
        </Button>
      </div>
      {isLoading ? (
        <Skeleton />
      ) : (
        <ScrollArea className="h-[35vh]">
          <div className={display === 'grid' ? gridClass : listClass}>
            {filteredData?.map((item) => (
              <div
                data-selected={item.name === selected}
                onClick={() => {
                  setSelected(item.name);
                }}
                onDoubleClick={() => {
                  if (item.type === 'directory') {
                    const newPath = `${path}/${item.name}`;
                    setHistory((prev) => [...prev, path]);
                    setPath(newPath);
                  } else {
                    handleSelect();
                  }
                }}
                key={item.name}
                className={cn(
                  'flex items-center rounded-lg px-2 py-1 h-fit hover:bg-violet-100 data-[selected=true]:hover:bg-violet-100 data-[selected=true]:bg-violet-200 hover:cursor-pointer dark:hover:bg-violet-800 dark:data-[selected=true]:hover:bg-violet-800 dark:data-[selected=true]:bg-violet-900',
                  display === 'grid' ? 'flex-col' : 'flex-row gap-2',
                )}
              >
                {item.type === 'directory' && (
                  <FolderIcon className="w-10 h-10 fill-muted stroke-1 dark:stroke-background" />
                )}
                {item.type === 'file' && (
                  <FileIcon className="w-10 h-10 fill-muted stroke-1 dark:stroke-background" />
                )}
                <span className="select-none text-xs text-muted-foreground text-center text-balance break-all">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default Nautilus;
