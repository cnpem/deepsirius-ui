import { api } from '~/utils/api';
import { Textarea } from './ui/textarea';
import { ImageGallery } from './image-gallery';

export function ViewRemoteLog({ path }: { path: string }) {
  const { data, error, isLoading, isError } = api.ssh.catTxt.useQuery({
    path,
  });

  if (isLoading) {
    return <p>Wait a minute</p>;
  }

  if (isError) {
    console.error('Error reading logs', error);
    return <p>Error: {error.message}</p>;
  }

  return (
    <Textarea
      className="text-md h-full w-3/4 resize-none bg-muted"
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
    return <p>Wait a minute</p>;
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
