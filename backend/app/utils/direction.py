def get_direction(azimuth: float) -> str:
    """Return 16-point compass direction from azimuth degrees."""
    directions = [
        "N", "NNE", "NE", "ENE",
        "E", "ESE", "SE", "SSE",
        "S", "SSW", "SW", "WSW",
        "W", "WNW", "NW", "NNW",
    ]
    index = int((azimuth + 11.25) // 22.5) % 16
    return directions[index]


def get_direction_verbose(azimuth: float) -> str:
    """Return full text label for 16-point compass direction."""
    verbose = {
        "N": "North",
        "NNE": "North-Northeast",
        "NE": "Northeast",
        "ENE": "East-Northeast",
        "E": "East",
        "ESE": "East-Southeast",
        "SE": "Southeast",
        "SSE": "South-Southeast",
        "S": "South",
        "SSW": "South-Southwest",
        "SW": "Southwest",
        "WSW": "West-Southwest",
        "W": "West",
        "WNW": "West-Northwest",
        "NW": "Northwest",
        "NNW": "North-Northwest",
    }
    short = get_direction(azimuth)
    return verbose.get(short, short)
