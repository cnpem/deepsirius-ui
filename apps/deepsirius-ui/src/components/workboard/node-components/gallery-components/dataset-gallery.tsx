import { api } from '~/utils/api';
import NodeIcon from '~/components/workboard/node-components/node-icon';
import { type DatasetData } from '~/hooks/use-store';
import { Badge } from '~/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card';

export default function DatasetGallery({
  datasetData,
}: {
  datasetData: DatasetData;
}) {
  const {
    remotePath,
    form: { datasetName, patchSize, sampleSize, strategy, classes, data },
  } = datasetData;

  return (
    <div className="space-4 h-full w-full">
      <div className="px-4 pb-4 pt-4">
        <Alert>
          <AlertTitle className="h-1/2">
            <NodeIcon className="mr-2 w-5" nodeType={'dataset'} />
            Dataset
          </AlertTitle>
          <AlertDescription className="flex h-1/2 flex-col">
            <p>
              <span className="font-bold text-blue-800 dark:text-blue-300">
                name:
              </span>{' '}
              {datasetName}
            </p>
            <p>
              <span className="font-bold text-blue-800 dark:text-blue-300">
                output:
              </span>{' '}
              {remotePath}
            </p>

            <div className="flex flex-wrap justify-normal gap-2">
              <p className="font-bold text-blue-800 dark:text-blue-300">
                Args:
              </p>
              <Badge>
                Patch Size
                <div className="mx-1 h-4 border-l border-gray-400"></div>
                {patchSize}
              </Badge>
              <Badge>
                Sample Size
                <div className="mx-1 h-4 border-l border-gray-400"></div>
                {sampleSize}
              </Badge>
              <Badge>
                Strategy
                <div className="mx-1 h-4 border-l border-gray-400"></div>
                {strategy}
              </Badge>
              <Badge>
                Classes
                <div className="mx-1 h-4 border-l border-gray-400"></div>
                {classes}
              </Badge>
            </div>
          </AlertDescription>
        </Alert>
      </div>
      <div className="px-4 pb-4">
        <div className="flex flex-col gap-4 justify-start my-auto">
          <p className="font-bold text-blue-800 dark:text-blue-300">
            Source images:
          </p>
          <div className="flex flex-wrap gap-4">
            {data &&
              data.map((d, i) => (
                <ImageGroupCard
                  key={i}
                  image={d.image}
                  label={d.label}
                  weightMap={d.weightMap}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageGroupCard({
  image,
  label,
  weightMap,
}: {
  image: string;
  label: string;
  weightMap: string | undefined;
}) {
    const imagePathArray = image.split('/');
    const imageName = imagePathArray.pop();
    const imageBasePath = imagePathArray.join('/') + '/';
    
  return (
    <Card className="w-fit">
      <CardHeader>
        <CardTitle>{imageName}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Path: {imageBasePath}</p>
        <p>Label: {label.split('/').pop()}</p>
        {weightMap && <p>Weight Map: {weightMap.split('/').pop()}</p>}
      </CardContent>
    </Card>
  );
}
