import React, { use } from "react";
import {cacheFetch, capitalize, snakeCaser} from '../Components/Utils';
import { typeMap, Type } from "../Components/Type";
import { FixedSizeList as List } from 'react-window';
import AutoSizer from "react-virtualized-auto-sizer";
import PokemonInfoPanel from "../Components/InfoPanel/PokemonInfoPanel";
// import FilterPanel from "../Components/FilterPanel";
import PokedexListItem from "../Components/PokedexListItem";
import { pkData, otherData, loadOtherData, loadPokeData } from "../Components/DataEnums";
import FilterPanelNew from "../Components/Filter/FilterPanelnEW";
import { filterData, updateFilterData, beginNewFilter } from "../Components/Filter/FilterClasses";
import { WindowWidth } from "./_app";
import { Router, useRouter } from "next/router";

export default function Home(props) {
  const router = useRouter()
  // console.log('Home Props ', router)
  const {MultiRangeSlider} = props
  const [pokeDataLoaded, setPokeDataLoaded] = React.useState(-1)
  const filteredPokes = React.useRef<any[]>([])
  const [pokeFiltered, setPokeFiltered] = React.useState(-1)

  const [search, setSearch] = React.useState<string>("")

  const [filterPredicates, setFilterPredicates] = React.useState<any[]>([])
  const [typeFilter, setTypeFilter] = React.useState<number>(0)

  const [sortOption, setSortOption] = React.useState('default')
  const [sortAscending, setSortAscending] = React.useState(1)
  // const [selectedPoke, rawSetSelectedPoke] = React.useState(1)
  const selectedPoke = parseInt(router.query.selectedPoke as string) || 1

  const setSelectedPoke = (a) => {
    // rawSetSelectedPoke(a);
    // setInfoShown(true);
    router.push(`/?selectedPoke=${a}`, undefined, {shallow: true})
  }

  // const [infoShown, setInfoShown] = React.useState(false)
  const windowWidth = React.useContext(WindowWidth)
  const isMobile = windowWidth < 780

  const statSort = (a, b, statId = 0) => (
    pkData[a]?.stats?.[statId]?.base_stat - pkData[b]?.stats?.[statId]?.base_stat
  )
  const sortOptions = {
    default: () => 1,
    // order: (a, b) => (pkData[a]?.pokemon?.order ?? 10_000) - (pkData[b]?.pokemon?.order ?? 10_000),
    name: (a, b) => pkData[a]?.pokemon?.identifier.localeCompare(pkData[b]?.pokemon?.identifier),
    hp: (a, b) => statSort(a, b, 0),
    attack: (a, b) => statSort(a, b, 1),
    defense: (a, b) => statSort(a, b, 2),
    spatk: (a, b) => statSort(a, b, 3),
    spdef: (a, b) => statSort(a, b, 4),
    speed: (a, b) => statSort(a, b, 5),
    height: (a, b) => pkData[a]?.pokemon?.height - pkData[b]?.pokemon?.height,
    weight: (a, b) => pkData[a]?.pokemon?.weight - pkData[b]?.pokemon?.weight,
    stat_total: (a, b) => {
      const comp = i => pkData[i]?.stats?.reduce((acc, val) => acc + val.base_stat, 0) ?? 0
      return comp(a) - comp(b)
    },
    stat_lowest: (a, b) => {
      const comp = i => pkData[i]?.stats?.reduce((acc, val) => Math.min(acc, val.base_stat), 255) ?? 0
      return comp(a) - comp(b)
    },
    stat_highest: (a, b) => {
      const comp = i => pkData[i]?.stats?.reduce((acc, val) => Math.max(acc, val.base_stat), 0) ?? 0
      return comp(a) - comp(b)
    },
    base_experience: (a, b) => pkData[a]?.pokemon?.base_experience - pkData[b]?.pokemon?.base_experience,
    type_id: (a, b) => (
      (pkData[a]?.types?.[0]?.type_id * 1_000 + (pkData[a]?.types?.[1]?.type_id ?? 0))
       - (pkData[b]?.types?.[0]?.type_id * 1_000 + (pkData[b]?.types?.[1]?.type_id ?? 0))
    )
  }

  const update = () => setPokeDataLoaded(old => old + 1)
  const updateFilter = () => setPokeFiltered(old => old + 1)

  React.useEffect(() => {
    const pkPromise = loadPokeData('');
    pkPromise.then(update);
    const speciesPromise = loadOtherData('species');

    ['', 'types', 'stats', 'abilities', 'moves']
    .forEach(label => loadPokeData(label).then(update));

    ['abilities', 'moves', 'move_effect_prose', 
      'ability_prose', 'types', 'stats', 'egg_groups',
      'items', 'evolution_triggers'
    ].forEach(label => loadOtherData(label).then(update));

    ['type_efficacy', 'species_egg_groups']
    .forEach(label => loadOtherData(label, 'array').then(update))

    Promise.all([pkPromise, speciesPromise]).then(() => {
      loadOtherData('forms', 'array')
      .then((a: any) => {
        Object.entries(a).slice(0, -1)
        .forEach((entry: any) => {
          const obj = otherData.species![pkData[entry[0]].pokemon?.species_id]
          if (obj !== undefined) {
            if (obj.hasOwnProperty('forms')) {
              obj.forms?.push(entry[1][0])
            } else {
              obj.forms = [entry[1][0]]
            }
          }
        })
        update()
      })
    })
    
    speciesPromise
    .then((a: any) => {
      update()
      loadOtherData('evolutions', 'array')
      .then((c: any) => {
        // console.log({c})
        Object.values(c).slice(0, -1)
        .forEach((b: any) => b.forEach(row => {
          const specId = row.evolved_species_id
          const prevolveId = a![specId].evolves_from_species_id
          if (!a![prevolveId]?.hasOwnProperty('evolves_into')) {
            a![prevolveId].evolves_into = []
          }
          a![prevolveId].evolves_into.push(row)
        }))
        update()
      }) 
    })
    return () => {
      for (let member in pkData) delete pkData[member];
      for (let member in otherData) delete otherData[member];
    }
  }, [])

  React.useEffect(() => {
    filteredPokes.current = []
    const minimumFilters = Object.entries(filterData)
      .filter(entry => {console.log(entry[1].hasChanged()); return entry[1].hasChanged?.()})
      .map(entry => entry[1].predicate)
    // console.log({minimumFilters})
    beginNewFilter()
    const lowered = search.toLowerCase()
    Object.keys(pkData ?? {}).forEach(pokeID => {
      const data = pkData[pokeID]
      const pokeName = data?.pokemon?.identifier ?? ''
      if (
        pokeName !== 'identifier'
        && pokeName.includes(lowered)
        && minimumFilters.every(predicate => predicate?.(pokeID, pkData[pokeID]?.pokemon?.species_id) ?? false)
      ) {
        filteredPokes.current.push(pokeID) 
      }
    })
    filteredPokes.current.sort((a, b) => sortOptions[sortOption](a, b) * sortAscending)
    updateFilter()
    updateFilterData()
  }, [search, typeFilter, pokeDataLoaded, sortOption, sortAscending, filterPredicates])

  const Row = React.useCallback(({index, style}: any) => <PokedexListItem
    // key={index}
    id={filteredPokes.current[index]}
    style={style} 
    setSelectedPoke={setSelectedPoke}
  />, [pokeDataLoaded, pokeFiltered])

  return (
    <div className="Pokedex">
      <div className="topbar">

        <input 
          type='search'
          className="search"
          placeholder="Search"
          onChange={(event) => setSearch(event.target.value)}
          value={search}
        />

        <div className="type-container">

          <div className="basic-text">{`${filteredPokes.current.length} results`}</div>

          <FilterPanelNew update={update}/> 

          <div>Sort: </div>
          <button onClick={() => setSortAscending(old => -old)}>
            {sortAscending === 1 ? 'Ascending' : 'Descending'}
          </button>
          <select onChange={event => setSortOption(event.target.value)}>
            {Object.keys(sortOptions)?.map(key => (
              <option value={key} key={key}>
                {key}
              </option>
            ))}
          </select>

        </div>
      </div>

      <div className={`scrollable-container ${isMobile ? 'mobile': 'desktop'}`}>
        <div className="scrollable" id="pokedex-scrollable">
          <AutoSizer>
            {({height, width}) => (
              <List
                itemCount={filteredPokes.current.length}
                itemSize={96 + 8}
                height={height}
                width={width}
                
              >
                {Row}
              </List>
            )}
          </AutoSizer>
        </div>
        
        <div className={"InfoPanel-container " + (selectedPoke > 0 ? 'shown' : '') + (windowWidth < 1000 ? ' mobile' : ' desktop')}>
          <PokemonInfoPanel
            id={selectedPoke}
            setSelectedPoke={setSelectedPoke}
          />
          {
            selectedPoke > 0 && isMobile &&
            <button style={{
              position: 'absolute',
              top: 0,
              left: 0,
              background: 'none',
              outline: 'none',
              border: 'none',
              color: 'gray',
              padding: '30px',
              fontSize: '1.25rem'
            }} onClick={() => setSelectedPoke(-1)}> X </button>
          }
        </div>
      </div>
    </div>
  )
}



