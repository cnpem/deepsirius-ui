import { api } from '~/utils/api';

export default function Hello() {
  const { data, isLoading, isError, error } = api.tbConsumer.hello.useQuery();

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (isError) {
    return (
      <div>
        <div>Error: {error?.message}</div>
        <pre>{JSON.stringify(error?.data, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div className="flex p-4">
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
