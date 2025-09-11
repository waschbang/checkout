export async function getServerSideProps() {
  return {
    redirect: {
      destination: "/viewrewards",
      permanent: false,
    },
  };
}

export default function HomeRedirect() {
  return null;
}
