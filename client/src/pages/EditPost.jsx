import { useParams } from "react-router-dom"
import CreatePost from "./CreatePost"

export default function EditPost() {
    const { postId } = useParams();
    return <CreatePost docID={postId} />
}