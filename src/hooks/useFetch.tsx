import {useEffect, useState} from 'react'

// @ts-ignore
const API_KEY = import.meta.env.VITE_GIPHY_API

const useFetch = ({keyword} : {keyword:string}) => {
    const [gifUrl, setGifUrl] = useState("")

    // @ts-ignore
    const fetchGifs = async () => {
        try {
            const response = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${API_KEY}&q=${keyword.split(' ').join('')}&limit=1&offset=0&rating=g&lang=en`)
            const {data} = await response.json()
            setGifUrl(data[0]?.images?.downsized_medium?.url)
        }catch (e) {
            setGifUrl('https://metro.co.uk/wp-content/uploads/2015/05/pokemon_crying.gif?quality=90&strip=all&zoom=1&resize=500%2C284')
        }
    }

    useEffect(() => {
        if (keyword) fetchGifs()
    }, [keyword])

    return gifUrl
}

export default useFetch