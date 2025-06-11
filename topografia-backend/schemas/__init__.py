# Importar todos los schemas para facilitar el uso
from .usuario import (
    PerfilUsuarioBase,
    PerfilUsuarioCreate,
    PerfilUsuarioUpdate,
    PerfilUsuarioResponse,
    PerfilUsuarioSimple
)

from .proyecto import (
    ProyectoBase,
    ProyectoCreate,
    ProyectoUpdate,
    ProyectoResponse,
    ProyectoCompletoCreate,
    ProyectoSimple
)

from .estacion import (
    EstacionTeoricaBase,
    EstacionTeoricaCreate,
    EstacionTeoricaUpdate,
    EstacionTeoricaResponse,
    EstacionTeoricaSimple
)

from .medicion import (
    MedicionEstacionBase,
    MedicionEstacionCreate,
    MedicionEstacionUpdate,
    MedicionEstacionResponse,
    MedicionEstacionSimple
)

from .lectura import (
    LecturaDivisionBase,
    LecturaDivisionCreate,
    LecturaDivisionUpdate,
    LecturaDivisionResponse,
    LecturaDivisionSimple
)