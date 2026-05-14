export const TOOLS_SCHEMAS = [
    {
        name: "get_user_workouts",
        description: "Obtiene el historial de entrenamientos recientes del usuario (solo necesita userId)",
        inputSchema: {
            type: "object",
            properties: { userId: { type: "string" } },
            required: ["userId"]
        },
    },
    {
        name: "get_user_routines",
        description: "Obtiene las rutinas guardadas del usuario",
        inputSchema: {
            type: "object",
            properties: { userId: { type: "string" } },
            required: ["userId"]
        },
    },
    {
        name: "get_user_profile",
        description: "Obtiene los detalles fisicos actuales del usuario (peso, altura, edad)",
        inputSchema: {
            type: "object",
            properties: { userId: { type: "string" } },
            required: ["userId"]
        },
    },
    {
        name: "search_exercises",
        description: "Busca ejercicios en la base de datos, filtrando opcionalmente por grupo muscular (ej: 'pecho', 'espalda', 'pierna')",
        inputSchema: {
            type: "object",
            properties: { muscleGroup: { type: "string" } }
        },
    },
    {
        name: "get_recommended_routines",
        description: "Obtiene rutinas predeterminadas recomendadas por el sistema",
        inputSchema: {
            type: "object",
            properties: {}
        },
    },
    {
        name: "create_user_routine",
        description: "CREA y guarda una nueva rutina en la BD. Úsala cuando el usuario autorice o pida guardar una rutina con nombre y ejercicios. Estima series/reps según sea necesario.",
        inputSchema: {
            type: "object",
            properties: {
                userId: { type: "string" },
                name: { type: "string", description: "Nombre corto de la rutina" },
                focus: { type: "array", items: { type: "string" }, description: "Ej: ['Pecho', 'Triceps']" },
                exercises: {
                    type: "array",
                    description: "Lista de ejercicios a añadir. Series/reps son obligatorios.",
                    items: {
                        type: "object",
                        properties: {
                            name: { type: "string", description: "Nombre del ejercicio a guardar. Ej: 'Press de Banca'" },
                            sets: { type: "number" },
                            reps: { type: "number" }
                        },
                        required: ["name", "sets", "reps"]
                    }
                }
            },
            required: ["userId", "name", "exercises"]
        }
    },
    {
        name: "update_user_routine",
        description: "MODIFICA y sobrescribe una rutina del usuario. Úsala cuando pida añadir, quitar o cambiar ejercicios de una rutina ya existente.",
        inputSchema: {
            type: "object",
            properties: {
                userId: { type: "string" },
                routineName: { type: "string", description: "Nombre de la rutina a modificar (ej: 'push')" },
                newName: { type: "string", description: "Opcional: Si el usuario desea renombrar la rutina." },
                exercises: {
                    type: "array",
                    description: "Lista COMPLETA RE-CALCULADA de ejercicios. Debes incluir los que ya tenía más los nuevos, o sin los eliminados.",
                    items: {
                        type: "object",
                        properties: {
                            name: { type: "string", description: "Nombre del ejercicio. Ej: 'Dominadas'" },
                            sets: { type: "number" },
                            reps: { type: "number" }
                        },
                        required: ["name", "sets", "reps"]
                    }
                }
            },
            required: ["userId", "routineName", "exercises"]
        }
    },
    {
        name: "search_food_nutrition",
        description: "Busca un alimento y devuelve en tiempo real sus macros exactos (Calorías, Proteína, Carbohidratos, Grasas) directamente del departamento USDA. Úsalo siempre para armar listas de comidas precisas.",
        inputSchema: {
            type: "object",
            properties: { query: { type: "string", description: "Nombre de la comida en inglés preferiblemente (ej. 'Chicken breast')" } },
            required: ["query"]
        },
    },
    {
        name: "calculate_user_tdee",
        description: "Obtiene las métricas metabólicas basales (TDEE, BMR) procesando matemáticamente el peso, edad y altura actual del usuario registrados en MongoDB de forma desatendida.",
        inputSchema: {
            type: "object",
            properties: { userId: { type: "string" } },
            required: ["userId"]
        },
    },
    {
        name: "get_user_workout_stats",
        description: "Aplica Big Data procesando masivamente todas las sesiones de entreno recientes del usuario en BD para conseguir Volumen Total Movido (kg) y Minutos Reales esforzados.",
        inputSchema: {
            type: "object",
            properties: { userId: { type: "string" } },
            required: ["userId"]
        },
    },
    {
        name: "get_user_plates",
        description: "Obtiene los platos y recetas personalizados que el usuario ha guardado en su recetario de GymTracker.",
        inputSchema: {
            type: "object",
            properties: { userId: { type: "string" } },
            required: ["userId"]
        },
    },
    {
        name: "get_user_diets",
        description: "Obtiene las dietas o planes nutricionales activos asignados al usuario.",
        inputSchema: {
            type: "object",
            properties: { userId: { type: "string" } },
            required: ["userId"]
        },
    },
    {
        name: "get_nutrition_summary",
        description: "Obtiene el histórico de consumo de los últimos 7 días de la base de datos.",
        inputSchema: {
            type: "object",
            properties: { userId: { type: "string" } },
            required: ["userId"]
        },
    },
    {
        name: "create_exercise",
        description: "Añade un nuevo ejercicio a la biblioteca global. Úsalo si el usuario quiere registrar un ejercicio que no existe.",
        inputSchema: {
            type: "object",
            properties: {
                name: { type: "string" },
                muscleGroup: { type: "string", description: "Ej: 'Pecho', 'Pierna'" },
                description: { type: "string" }
            },
            required: ["name", "muscleGroup"]
        }
    },
    {
        name: "create_user_diet",
        description: "Crea un plan nutricional semanal o diario completo para el usuario.",
        inputSchema: {
            type: "object",
            properties: {
                userId: { type: "string" },
                name: { type: "string", description: "Nombre de la dieta (ej: 'Volumen Limpio')" },
                totalCalories: { type: "number" },
                description: { type: "string" }
            },
            required: ["userId", "name", "totalCalories"]
        }
    },
    {
        name: "create_user_plate",
        description: "Guarda un plato o receta personalizada en el recetario del usuario.",
        inputSchema: {
            type: "object",
            properties: {
                userId: { type: "string" },
                name: { type: "string", description: "Nombre del plato (ej: 'Batido Post-Entreno')" },
                ingredients: { type: "array", items: { type: "string" } },
                calories: { type: "number" }
            },
            required: ["userId", "name", "calories"]
        }
    },
    {
        name: "add_user_meal",
        description: "Registra una comida consumida hoy por el usuario para el seguimiento de calorías.",
        inputSchema: {
            type: "object",
            properties: {
                userId: { type: "string" },
                foodName: { type: "string" },
                calories: { type: "number" },
                protein: { type: "number" },
                carbs: { type: "number" },
                fat: { type: "number" }
            },
            required: ["userId", "foodName", "calories"]
        }
    },
    {
        name: "update_user_profile",
        description: "Actualiza los datos físicos del usuario (peso, altura, edad, nivel de actividad).",
        inputSchema: {
            type: "object",
            properties: {
                userId: { type: "string" },
                weight: { type: "number" },
                height: { type: "number" },
                age: { type: "number" },
                activityLevel: { type: "string", description: "sedentary, moderate, active" }
            },
            required: ["userId"]
        }
    }
];
