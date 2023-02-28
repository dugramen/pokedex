import React from 'react';

export async function cacheFetch(request: RequestInfo | URL, options?: any) {
    const cache = await caches.open('pokeapi');
    const response = await cache.match(request)
    if (response !== undefined) {
        // console.log('old request ', request)
        return response
    }
    else {
        // console.log('new request ', request)
        await cache.add(request)
        return cache.match(request)
    }
}

export const capitalize = (string: string) => {
    return (string?.charAt(0).toUpperCase() + string?.slice(1)) ?? '';
} 

export function snakeCaser(...strings: (any)[]) {
    let result = ''
    let isFirst = true
    for (let i = 0; i < strings.length; i++) {
      if (strings[i] === '' || strings[i] === undefined || strings[i] === null) { 
        continue 
      }
      if (!isFirst) {
        result += '_'
      }
      isFirst = false
      result += strings[i]
    }
    return result
  }

export function parseProse(text: string, data) {
    const ntext = text?.split(/(?=\$)/g).reduce((accum, val) => {
        // console.log({val})
        if (val[0] === '$') {
            let snip = val.slice(1)
            const search = Object.getOwnPropertyNames(data).find((key) => snip.startsWith(key))
            if (search) {
                snip = snip.replace(search, '')
                return accum + ' ' + data?.[search]?.toString() + snip
            }
            return accum + ' ' + val
        } 
        return accum + ' ' + val
    }, '')
    return ntext?.replaceAll('[', '[ ').split(/(?:,|\[|\]|{|})+/).reduce((accum, val, index) => {
        const remainder = index % 3
        if (remainder === 0) {
            return [...accum, val]
        }
        if (remainder === 1) {
            if (val === ' ') {
                return [...accum, 'TYPE']
            }
            return [...accum, val]
        }
        else {
            return accum
        }
    }, [] as any[])
} 

export const blankEntryDasher = (text) => text === "" ? "--" : text

export const CollageGrid = ({columns = 2, ...props}) => {
    // console.log({children: props.children})
    return (
        <div 
            className='collage-grid'
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`
            }}
        >
            {[...Array(columns)].map((val, colIndex) => (
                <div className='column' key={colIndex}>
                    { props.children
                    ?.filter?.((child, index) => index % columns === colIndex) }
                </div>
            ))}
        </div>
    )
}

export function Modal(props: {onHide?, label, children?}) {
    const [shown, setShown] = React.useState(false)
    const modalRef = React.useRef<any>()

    const hide = () => {
        setShown(false)
        props.onHide?.()
    }

    return (
        <div className='FilterPanel'>
            <button onClick={() => setShown(true)}>{props.label}</button>

            <div 
                className={`modal ${shown ? 'shown' : ''}`} 
                onMouseDown={event => modalRef.current && modalRef.current === event.target && hide()}
                ref={modalRef}
            >   
                <div className='modal-content'>
                    {props.children}
                </div>
            </div>
        </div>
    )
}
