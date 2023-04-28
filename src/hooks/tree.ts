import useSWR from "swr";
import { type nodeItem } from "~/types/nodeItem";

type fetchParams = {
  path: string;
  url: string;
};

export async function treeFetcher(props: fetchParams): Promise<nodeItem[]> {
  const { url, path } = props;
  const params = { path: path };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (res.ok) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const item: nodeItem = await res.json();
      return [item];
    } else {
      throw new Error("Network response was not ok");
    }
  } catch (err) {
    throw err;
  }
}

export function useTree(path: string) {
  const { data, isLoading, mutate } = useSWR<nodeItem[]>(
    { url: "/api/filesystem", path: path },
    treeFetcher,
    {
      fallbackData: new Array<nodeItem>(),
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  );

  return {
    tree: data,
    isLoading,
    mutate,
  };
}
