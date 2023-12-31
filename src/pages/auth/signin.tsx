import type { GetServerSidePropsContext } from 'next';
import { signIn } from 'next-auth/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { Icons } from '~/components/icons';
import { Layout } from '~/components/layout';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { getServerAuthSession } from '~/server/auth';

type FormData = {
  email: string;
  password: string;
};
function Form() {
  const router = useRouter();
  const query = router.query;
  const callbackUrl = (query.callbackUrl as string) || '/workboard';
  // const callbackUrl = '/workboard';
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();
  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      const res = await signIn('credentials', {
        email: data.email,
        password: data.password,
        callbackUrl: callbackUrl,
        redirect: false,
      });
      if (!res?.error) {
        await router.push(callbackUrl);
      } else {
        setError('Invalid email or password!');
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <form
      className="w-full space-y-12 sm:w-[400px]"
      // Note: This is a workaround for a bug in react-hook-form
      // See: https://github.com/orgs/react-hook-form/discussions/8020#discussioncomment-3362300
      onSubmit={(...args) => void handleSubmit(onSubmit)(...args)}
    >
      <div className="grid items-center justify-center">
        <Icons.logo />
      </div>
      <h1 className="mb-2 flex justify-center text-xl font-semibold">
        <span className="text-fuchsia-600 dark:text-fuchsia-500">Deep</span>
        Sirius
      </h1>
      {error && (
        <div className="flex w-full items-center justify-center rounded-sm bg-red-700 font-semibold text-white">
          <p role="alert">{error}</p>
        </div>
      )}
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="email">Email</Label>
        {errors.email && (
          <p role="alert" className="text-red-600">
            {errors.email?.message}
          </p>
        )}
        <Input
          placeholder="user.name@example.com"
          {...register('email', { required: 'Email is required!' })}
        />
      </div>
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="password">Password</Label>
        {errors.password && (
          <p role="alert" className="text-red-600">
            {errors.password?.message}
          </p>
        )}
        <Input
          type="password"
          placeholder="Password"
          {...register('password', {
            required: 'Password is required!',
          })}
        />
      </div>
      <Button className="w-full" type="submit">
        Sign in
      </Button>
    </form>
  );
}

export default function SignIn() {
  return (
    <Layout>
      <Head>
        <title>Sign in</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="space-y-12 rounded-xl px-8 pb-8 pt-12 dark:bg-slate-900 sm:shadow-xl">
          <Form />
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerAuthSession(context);

  // If the user is already logged in, redirect.
  // Note: Make sure not to redirect to the same page
  // To avoid an infinite loop!
  if (session) {
    return { redirect: { destination: '/workboard' } };
  }

  return {
    props: {
      session,
    },
  };
}
