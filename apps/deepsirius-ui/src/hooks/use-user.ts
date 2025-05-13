import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type User = {
  name: string;
  email: string;
  route: string;
};

export const useUser = () => {
  const { data } = useSession();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (data?.user.name && data?.user.email) {
      setUser({
        name: data.user.name,
        email: data.user.email,
        route: `/u/${data.user.name}`,
      });
    } else {
      setUser(null);
    }
  }, [data]);
  return user;
};
