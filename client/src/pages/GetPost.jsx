import { useParams } from "react-router-dom"
import ShowPost from "./ShowPost"

export default function GetPost() {
    const { postId } = useParams();
    return <ShowPost docID={postId} />
}