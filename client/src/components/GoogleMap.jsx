import { memo } from "react"

export const GameMap = memo(({ embeddedMap }) => {
    return <div dangerouslySetInnerHTML={{ __html: embeddedMap }} />;
});