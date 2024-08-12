export type None = false;

export type Create = 'None';

export type Move = { positions: {x: number, y: number}[] };

export type Rotate = { 
    degreeOffset: number,
    positions: {x: number, y: number}[],
};

export type Scale = {
    scaledAttributes: (
        { width: number, height: number} | //dimension
        number  | //radius
        {x: number, y: number}[] //points
    )[],
    positions: {x: number, y: number}[],
}

export type RecordsValue = 
    string   |
    number   |
    number[] |
    boolean  |
    None     |
    Create   |
    Move     |
    Rotate   |
    Scale    ;