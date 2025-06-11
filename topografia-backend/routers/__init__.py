# Importar todos los routers para facilitar el uso
from . import usuarios
from . import proyectos
from . import estaciones
from . import mediciones
from . import lecturas

__all__ = [
    "usuarios",
    "proyectos", 
    "estaciones",
    "mediciones",
    "lecturas"
]