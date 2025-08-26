export async function getServerSideProps() {
  return {
    redirect: {
      destination: "/premium/checkout",
      permanent: false,
    },
  };
}

export default function HomeRedirect() {
  return null;
}
