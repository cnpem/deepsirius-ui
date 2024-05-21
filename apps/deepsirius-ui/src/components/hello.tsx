import { api } from '~/utils/api';

export default function Hello() {
  const { data, isLoading } = api.tbConsumer.hello.useQuery();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex p-4">
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
