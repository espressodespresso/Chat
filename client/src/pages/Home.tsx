import Auth from "../components/Auth.js";
import Layout from "../components/Layout.js";

export default function Home() {
    return (
        <>
            <Auth/>
            <Layout>
                <div class="grid grid-cols-1 place-items-center">
                    <h1>Hello - Home</h1>
                </div>
            </Layout>
        </>
    )
}