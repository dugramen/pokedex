
import { snakeCaser } from "./Utils"

export const pkData: OList<PkData> = {}
export const otherData: OtherData = {}

export function loadPokeData(key = '', prefix = 'pokemon') {
    return new Promise(res => {
        const ref = pkData
        fetch(`/api/data/${snakeCaser(prefix, key)}`)
        .then(res => res?.json())
        .then(data => {
            const snakedKey = snakeCaser(key)
            Object.getOwnPropertyNames(data).forEach(pokeID => {
                const dataToObject = row => data.headers.reduce((accum, val, index) => ({
                    ...accum,
                    [val]: row[index]
                }), {})
                if (!ref.hasOwnProperty(pokeID)) { ref[pokeID] = {} }
                if (snakedKey === '') { ref[pokeID].pokemon = dataToObject(data[pokeID]) }
                else {
                    if (Array.isArray(data[pokeID][0])) {
                        if (!ref[pokeID].hasOwnProperty(snakedKey)) {
                        ref[pokeID][snakedKey] = []
                        }
                        data[pokeID].forEach( row => ref[pokeID][snakedKey].push(dataToObject(row)) )
                    }
                    else if (!ref[pokeID].hasOwnProperty(snakedKey)) {
                        ref[pokeID][snakedKey] = dataToObject(data[pokeID])
                    }
                }
            })
            // update()
            console.log(ref)
            res(ref)
        })
    })
}

export function loadOtherData(key, dataType: 'array' | 'object' = 'object') {
    return new Promise(res => {
        fetch(`/api/data/${key}`)
        .then(res => res.json())
        .then(data => {
            otherData[key] = {headers: data.headers}
            const reducer = (row) => data.headers.reduce((accum, val, index) => ({
                ...accum,
                [val]: row[index]
            }), {})
            Object.getOwnPropertyNames(data).forEach(rowId => {
                otherData[key][rowId] = dataType === 'object'
                ? reducer(data[rowId])
                : data[rowId].map(row => reducer(row))
            })
            console.log(otherData)
            res(otherData[key])
        })
    })
}




export interface ObjectList<T> {
    [key: string | number | symbol]: T
}
export interface OList<T> {
    [key: string | number | symbol]: T
}

export interface PkPokemon { id, identifier, species_id, height, weight, base_experience, order, is_default }
export interface PkType { pokemon_id, type_id, slot }
export interface PkMove { pokemon_id, version_group_id, move_id, pokemon_move_method_id, level, order }
export interface PkStat { pokemon_id, stat_id, base_stat, effort }
export interface PkAbility { pokemon_id, ability_id, is_hidden, slot }
export interface PkData {
    pokemon?: PkPokemon,
    types?: PkType[],
    stats?: PkStat[],
    moves?: PkMove[],
    abilities?: PkAbility[],
    forms?: Forms[],
}


export interface Move {
    id, identifier, generation_id, 
    type_id, power, pp, accuracy, 
    priority, target_id, damage_class_id, 
    effect_id, effect_chance, contest_type_id, 
    contest_effect_id, super_contest_effect_id
}
export interface MoveEffectProse { move_effect_id, local_language_id, short_effect, effect }
export interface Ability { id, identifier, generation_id, is_main_series }
export interface AbilityProse { ability_id, local_language_id, short_effect, effect }
export interface Types { id, identifier, generation_id, damage_class_id }
export interface TypeEfficacy { damage_type_id, target_type_id, damage_factor }
export interface OtherData { 
    moves?: OList<Move>, 
    abilities?: OList<Ability>, 
    move_effect_prose?: OList<MoveEffectProse>,
    types?: OList<Types>,
    ability_prose?: OList<AbilityProse>,
    species?: OList<Species>,
    species_dex_numbers?: OList<DexNumbers>,
    evolutions?: OList<Evolution[]>,
    species_egg_groups?: OList<SpeciesEggGroup[]>,
    egg_groups?: OList<{id, identifier}>,
    stats?: OList<{
        id, damage_class_id, identifier, is_battle_only, game_index
    }>,
    type_efficacy?: OList<TypeEfficacy[]>,
    items?: OList<Item>,
    evolution_triggers?: OList<{id,identifier}>,
}

export interface Forms {
    id, identifier, form_identifier, pokemon_id,
    introduced_in_version_group_id, is_default,
    is_battle_only, is_mega, form_order, order
}

export interface Species {
    id, identifier, generation_id, evolves_from_species_id, 
    evolution_chain_id, color_id, shape_id, habitat_id, gender_rate, 
    capture_rate, base_happiness, is_baby, hatch_counter, 
    has_gender_differences, growth_rate_id, forms_switchable, 
    is_legendary, is_mythical, order, conquest_order,

    evolves_into?: Evolution[],
    forms?: Forms[],
}

export interface DexNumbers {
    species_id, pokedex_id, pokedex_number
}

export interface Evolution {
    id, evolved_species_id, evolution_trigger_id,
    trigger_item_id, minimum_level, gender_id,
    location_id, held_item_id, time_of_day,
    known_move_id, known_move_type_id, minimum_happiness,
    minimum_beauty, minimum_affection, relative_physical_stats,
    party_species_id, party_type_id, trade_species_id,
    needs_overworld_rain, turn_upside_down
}

export interface Item {
    id,identifier,category_id,cost,fling_power,fling_effect_id
}

export interface SpeciesEggGroup { species_id, egg_group_id }
