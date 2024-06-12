import { api } from '~/utils/api';
import { Textarea } from './ui/textarea';
import { ImageGallery } from './image-gallery';

export function ViewRemoteLog({ path }: { path: string }) {
  const { data, error, isLoading, isError } = api.ssh.catTxt.useQuery({
    path,
  });

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    console.error('Error reading logs', error);
    return <p>Error: {error.message}</p>;
  }

  return (
    <Textarea
      className="text-md h-full w-full resize-none bg-muted shadow-lg"
      value={data.content}
      readOnly={true}
    />
  );
}

export function ViewRemoteImages({ path }: { path: string }) {
  const { data, error, isLoading, isError } =
    api.ssh.unzipImagesFromPath.useQuery(
      {
        dirPath: path,
      },
      {
        enabled: !!path,
        refetchOnMount: false,
      },
    );

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    console.error('Error reading logs', error);
    return <p>Error: {error.message}</p>;
  }

  return (
    <ImageGallery
      images={data.srcList.sort((a, b) => {
        if (a.name === 'original') return -1;
        return a.name.localeCompare(b.name);
      })}
      sizesm={128}
    />
  );
}

export function Tensorboard({
  logdir,
}: {
  logdir: string;
}) {
  const tensorboardUrl = api.ssh.getTensorboardUrlFromPath.useQuery({
    path: logdir,
    lines: 15,
  });

  if (tensorboardUrl.isLoading) {
    return <Loading />;
  }

  if (tensorboardUrl.isError) {
    console.error('Error starting tensorboard', tensorboardUrl.error);
    return <p>Error: {tensorboardUrl.error.message}</p>;
  }

  return (
    <iframe
      src={tensorboardUrl.data.url}
      className="h-full w-full rounded-lg"
    />
  );
}

function Loading() {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed">
      <p className="h-1/2 text-center text-muted-foreground">Waiting for the tensorboard Url...</p>
    </div>
  );
}
