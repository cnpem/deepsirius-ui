import { api } from '~/utils/api';
import NodeIcon from '~/components/workboard/node-components/node-icon';
import { type AugmentationData } from '~/hooks/use-store';
import { Badge } from '~/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { ImageGallery, ImageGalleryLoading } from '~/components/image-gallery';

export default function AugmentationGallery({
  augmentationData,
}: {
  augmentationData: AugmentationData;
}) {
  const {
    remotePath,
    form: { augmentedDatasetName, augmentationArgs },
  } = augmentationData;

  const outputImgDir = `${remotePath
    .split('/')
    .slice(0, -1)
    .join('/')}/${augmentedDatasetName}_preview/`;

  const {
    rot90,
    rot270,
    flipHorizontal,
    flipVertical,
    elastic,
    poissonNoise,
    averageBlur,
    gaussianBlur,
    linearContrast,
    contrast,
    dropout,
  } = augmentationArgs;

  function Images({ path }: { path: string }) {
    const { data, error, isLoading } = api.ssh.unzipImagesFromPath.useQuery(
      {
        dirPath: path,
      },
      {
        enabled: !!path,
        refetchOnMount: false,
      },
    );

    if (isLoading) {
      console.log('loading images...');
      return <ImageGalleryLoading quantity={20} />;
    }

    if (error) {
      console.error('error', error);
      return (
        <div className="mx-auto flex h-full items-center justify-center">
          <p className="text-3xl font-light ">500</p>
          <div className="mx-4 h-12 border-l border-gray-400"></div>
          <p className="">Error getting images: {error.message}</p>
        </div>
      );
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

  return (
    <div className="space-4 h-full w-full">
      <div className="h-1/3 px-4 pb-4 pt-4">
        <Alert>
          <AlertTitle className="h-1/2">
            <NodeIcon className="mr-2 w-5" nodeType={'augmentation'} />
            Augmentation
          </AlertTitle>
          <AlertDescription className="h-1/2 flex flex-col">
            <p><span className='font-bold text-blue-800 dark:text-blue-300'>name:</span> {augmentedDatasetName}</p>
            <p><span className='font-bold text-blue-800 dark:text-blue-300'>output:</span> {`../${outputImgDir.split('/').slice(-2).join('/')}`}</p>
            <p className="my-1 font-bold text-blue-800 dark:text-blue-300">
              Augmentation Args:
            </p>
            <div className="flex flex-wrap gap-2 justify-normal">
            <AugmentationArgLabel argname="Rotation 90°" select={rot90.select} />
            <AugmentationArgLabel
              argname="Rotation 270°"
              select={rot270.select}
            />
            <AugmentationArgLabel
              argname="Flip Horizontal"
              select={flipHorizontal.select}
            />
            <AugmentationArgLabel
              argname="Flip Vertical"
              select={flipVertical.select}
            />
            <AugmentationArgLabel
              argname="Elastic"
              select={elastic.select}
              params={[
                { key: 'alpha', value: elastic.alpha },
                { key: 'sigma', value: elastic.sigma },
              ]}
            />
            <AugmentationArgLabel
              argname="Poisson Noise"
              select={poissonNoise.select}
              params={[{ key: 'scale', value: poissonNoise.scale }]}
            />
            <AugmentationArgLabel
              argname="Average Blur"
              select={averageBlur.select}
              params={[{ key: 'ksize', value: averageBlur.kernelSize }]}
            />
            <AugmentationArgLabel
              argname="Gaussian Blur"
              select={gaussianBlur.select}
              params={[{ key: 'sigma', value: gaussianBlur.sigma }]}
            />
            <AugmentationArgLabel
              argname="Linear Contrast"
              select={linearContrast.select}
              params={[{ key: 'factor', value: linearContrast.factor }]}
            />
            <AugmentationArgLabel
              argname="Contrast"
              select={contrast.select}
              params={[{ key: 'factor', value: contrast.factor }]}
            />
            <AugmentationArgLabel
              argname="Dropout"
              select={dropout.select}
              params={[{ key: 'factor', value: dropout.factor }]}
            />
            </div>
          </AlertDescription>
        </Alert>
      </div>
      <div className="h-2/3 px-4 pb-4">
        <Images path={outputImgDir} />
      </div>
    </div>
  );
}

type AugmentationArg = {
  argname: string;
  select: boolean;
  params?: { key: string; value: number | [number, number] | undefined }[];
};

function AugmentationArgLabel({ argname, select, params }: AugmentationArg) {
  if (!select)
    return (
      <Badge variant={"secondary"}>
        {argname}
      </Badge>
    );

  if (!params)
    return (
      <Badge>
        {argname}
      </Badge>
    );

  return (
    <Badge>
      {argname}
      <div className="border-l border-gray-400 h-4"></div>
      {params.map((param, i) => (
        <span key={i} className="ml-1">
          {param.key}: {param.value?.toString() ?? ''}
        </span>
      ))}
    </Badge>
  );
}
