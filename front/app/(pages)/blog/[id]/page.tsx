import BlogsPage from "./components/blogsRender";


export default function Blog({ params }: { params: { id: string } }) {
  return (
    <div>
      <BlogsPage id={params.id} />
    </div>
  );
}
