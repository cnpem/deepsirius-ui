import { useCallback, useState } from 'react';
import { Button } from '~/components/ui/button';
import { Dialog, DialogTrigger, DialogContent } from '~/components/ui/dialog';
import { Label } from '~/components/ui/label';
import { ArrowLeftCircleIcon, ArrowRightCircleIcon } from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';
import { Skeleton } from './ui/skeleton';

type ImageProps = {
  src: string;
  name: string;
};

type SelectedProps = {
  image: ImageProps;
  rightNeighbour: ImageProps | undefined;
  leftNeighbour: ImageProps | undefined;
};

type ImageGalleryProps = {
  images: ImageProps[];
  sizesm?: number;
  sizelg?: number;
};

export function ImageGallery({ images, sizelg }: ImageGalleryProps) {
  const [selected, setSelected] = useState<SelectedProps | undefined>(
    undefined,
  );
  const onSelectionChange = useCallback(
    (selected: ImageProps | undefined) => {
      if (!selected) {
        setSelected(undefined);
        return;
      }
      const i = images.findIndex((img) => img === selected);
      const rightNeighbour = i < images.length - 1 ? images[i + 1] : undefined;
      const leftNeighbour = i > 0 ? images[i - 1] : undefined;
      setSelected({ image: selected, rightNeighbour, leftNeighbour });
    },
    [images],
  );

  const open = selected?.image !== undefined;

  return (
    <div className="h-full w-3/4 overflow-y-auto rounded-lg border bg-muted pt-4 shadow-lg">
      <Dialog
        open={open}
        onOpenChange={(open) => {
          if (!open) {
            onSelectionChange(undefined);
          }
        }}
      >
        <div className="flex flex-wrap justify-center">
          {images.map((image) => (
            <DialogTrigger
              key={image.name}
              className={
                'mx-auto w-full rounded-md p-1 md:mx-4 md:w-32 lg:mx-4 lg:w-32'
              }
              onClick={() => onSelectionChange(image)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.src}
                alt={image.name}
                style={{
                  objectFit: 'contain',
                  alignSelf: 'center',
                }}
                className="rounded-md transition-all duration-300 ease-in-out hover:scale-105 hover:opacity-95"
                loading="lazy"
              />
              <Label className="capitalize text-muted-foreground">
                {image.name}
              </Label>
            </DialogTrigger>
          ))}
        </div>
        <DialogContent className="flex flex-shrink flex-col items-center gap-1 p-10 ">
          {open && (
            <ImageFull
              image={selected.image}
              size={sizelg}
              leftNeighbour={selected.leftNeighbour}
              rightNeighbour={selected.rightNeighbour}
              onSelectionChange={onSelectionChange}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ImageFull({
  image,
  size,
  leftNeighbour,
  rightNeighbour,
  onSelectionChange,
}: {
  image: ImageProps;
  size?: number;
  leftNeighbour: ImageProps | undefined;
  rightNeighbour: ImageProps | undefined;
  onSelectionChange: (image: ImageProps | undefined) => void;
}) {
  const { src, name } = image;
  useHotkeys('left', () => onSelectionChange(leftNeighbour), {
    enabled: !!leftNeighbour,
  });
  useHotkeys('right', () => onSelectionChange(rightNeighbour), {
    enabled: !!rightNeighbour,
  });

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onSelectionChange(leftNeighbour)}
        className="absolute -left-1/4 top-1/2"
      >
        <ArrowLeftCircleIcon className="h-10 w-10 text-slate-300" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onSelectionChange(rightNeighbour)}
        className="absolute -right-1/4 top-1/2"
      >
        <ArrowRightCircleIcon className="h-10 w-10 text-slate-300" />
      </Button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={name}
        width={size ?? 512}
        height={size ?? 512}
        style={{ objectFit: 'contain' }}
        className="rounded-md"
        loading="lazy"
      />
      <Label>{name}</Label>
    </>
  );
}

export function ImageGalleryLoading({ quantity }: { quantity: number }) {
  return (
    <div className="grid h-full w-full grid-rows-[auto,1fr]">
      <div className="overflow-y-scroll">
        <div className="flex flex-wrap justify-center gap-1">
          {[...Array(quantity).keys()].map((i) => (
            <div key={i} className="mx-auto flex flex-col items-center">
              <Skeleton key={`image-${i}`} className="h-28 w-28 rounded-md" />
              <Skeleton key={`label-${i}`} className="mt-2 h-4 w-28" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
