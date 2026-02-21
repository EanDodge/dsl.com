import viteLogo from '/vite.svg'

export default function Playercard({Name,Position}){
    return (
        <div>
            <img src = {viteLogo} alt = {Name} />
            <p>{Name} - {Position}</p>
        </div>
    )
}