import { getDb } from "../config/db.js";
import { ObjectId } from "mongodb";

export class ToolController {
    static async handleToolCall(name, args) {
        const db = getDb();
        if (!db) {
            return { content: [{ type: "text", text: "Error: La base de datos no está conectada." }], isError: true };
        }

        try {
            let userObjectId = null;
            if (args.userId) {
                try {
                    userObjectId = new ObjectId(args.userId);
                } catch(e) {
                    userObjectId = args.userId;
                }
            }

            switch(name) {
                case "get_user_profile": return await this.getUserProfile(db, userObjectId);
                case "get_user_workouts": return await this.getUserWorkouts(db, userObjectId);
                case "get_user_routines": return await this.getUserRoutines(db, userObjectId);
                case "search_exercises": return await this.searchExercises(db, args.muscleGroup);
                case "get_recommended_routines": return await this.getRecommendedRoutines(db);
                case "create_user_routine": return await this.createUserRoutine(db, userObjectId, args);
                case "update_user_routine": return await this.updateUserRoutine(db, userObjectId, args);
                case "search_food_nutrition": return await this.searchFoodNutrition(args.query);
                case "calculate_user_tdee": return await this.calculateUserTDEE(db, userObjectId);
                case "get_user_workout_stats": return await this.getWorkoutStats(db, userObjectId);
                case "get_user_plates": return await this.getUserPlates(db, userObjectId);
                case "get_user_diets": return await this.getUserDiets(db, userObjectId);
                case "get_nutrition_summary": return await this.getNutritionSummary(db, userObjectId);
                default: throw new Error(`Tool not found: ${name}`);
            }
        } catch (e) {
            return { content: [{ type: "text", text: `Error ejecutando la tool: ${e.message}` }], isError: true };
        }
    }

    static async getUserProfile(db, userObjectId) {
        if (!userObjectId) throw new Error("El userId es requerido para get_user_profile");
        const user = await db.collection("users").findOne({ _id: userObjectId });
        if (!user) return { content: [{ type: "text", text: "Usuario no encontrado." }], isError: false };
        const reply = `El usuario ${user.username} tiene ${user.age} años, pesa ${user.weight}kg y mide ${user.height}cm.`;
        return { content: [{ type: "text", text: reply }], isError: false };
    }

    static async getUserWorkouts(db, userObjectId) {
        if (!userObjectId) throw new Error("El userId es requerido para get_user_workouts");
        const workouts = await db.collection("workoutsessions")
            .find({ userId: userObjectId })
            .sort({ fecha: -1 })
            .limit(5)
            .toArray();
            
        if (workouts.length === 0) {
            return { content: [{ type: "text", text: "No hay entrenamientos recientes." }], isError: false };
        }
        
        let reply = "Resumen de los últimos 5 entrenamientos:\n";
        for (const w of workouts) {
            const date = w.fecha ? new Date(w.fecha).toLocaleDateString() : 'desconocida';
            reply += `- ${w.nombre_rutina} el ${date} (Duración: ${w.duracion_minutos || '?'} min, Volumen: ${w.volumen_total || '?'} kg). Ejercicios hechos: ${w.ejercicios_realizados?.length || 0}\n`;
        }
        return { content: [{ type: "text", text: reply }], isError: false };
    }

    static async getUserRoutines(db, userObjectId) {
        if (!userObjectId) throw new Error("El userId es requerido para get_user_routines");
        const routines = await db.collection("routines").aggregate([
            { $match: { userId: userObjectId } },
            {
                $lookup: {
                    from: "exercices",
                    localField: "exercises.exerciseId",
                    foreignField: "_id",
                    as: "exerciseDetails"
                }
            }
        ]).toArray();

        if (routines.length === 0) {
            return { content: [{ type: "text", text: "El usuario no tiene rutinas personalizadas creadas." }], isError: false };
        }
        
        let reply = "Rutinas guardadas del usuario:\n";
        routines.forEach(r => {
            reply += `- ${r.name} (Foco: ${r.focus?.join(', ') || 'General'}):\n`;
            if (!r.exercises || r.exercises.length === 0) {
                reply += `  * (Rutina vacía, no tiene ejercicios añadidos todavía)\n`;
            } else {
                r.exercises.forEach(ex => {
                    const details = r.exerciseDetails?.find(d => d._id.toString() === ex.exerciseId.toString());
                    const exName = details ? details.name : 'Ejercicio desconocido';
                    reply += `  * ${exName}: ${ex.sets} series x ${ex.reps} repeticiones\n`;
                });
            }
            reply += "\n";
        });
        return { content: [{ type: "text", text: reply }], isError: false };
    }

    static async searchExercises(db, muscleGroup) {
        let filter = {};
        if (muscleGroup) {
            filter.muscle_group = { $regex: muscleGroup, $options: "i" };
        }
        const exercises = await db.collection("exercices").find(filter).limit(15).toArray();
        if (exercises.length === 0) return { content: [{ type: "text", text: "No se encontraron ejercicios con ese criterio."}], isError: false };

        let reply = "Ejercicios encontrados:\n";
        exercises.forEach(e => {
            reply += `- ${e.name} (Músculo: ${e.muscle_group}, Dificultad: ${e.difficulty || 'medium'}, Mecánica: ${e.mechanics || 'compound'})\n`;
        });
        return { content: [{ type: "text", text: reply }], isError: false };
    }

    static async getRecommendedRoutines(db) {
        const routines = await db.collection("routines").aggregate([
            { $match: { isSystemRoutine: true } },
            {
                $lookup: {
                    from: "exercices",
                    localField: "exercises.exerciseId",
                    foreignField: "_id",
                    as: "exerciseDetails"
                }
            }
        ]).toArray();

        if (routines.length === 0) {
            return { content: [{ type: "text", text: "No hay rutinas recomendadas en el sistema por ahora." }], isError: false };
        }

        let reply = "Rutinas RECOMENDADAS del sistema:\n";
        routines.forEach(r => {
            reply += `- ${r.name} (Foco: ${r.focus?.join(', ') || 'General'}):\n`;
            if (!r.exercises || r.exercises.length === 0) {
                reply += `  * (Rutina vacía)\n`;
            } else {
                r.exercises.forEach(ex => {
                    const details = r.exerciseDetails?.find(d => d._id.toString() === ex.exerciseId.toString());
                    const exName = details ? details.name : 'Ejercicio desconocido';
                    reply += `  * ${exName}: ${ex.sets} series x ${ex.reps} repeticiones\n`;
                });
            }
            reply += "\n";
        });
        return { content: [{ type: "text", text: reply }], isError: false };
    }

    static async createUserRoutine(db, userObjectId, args) {
        if (!userObjectId) throw new Error("El userId es requerido para create_user_routine");
        if (!args.name || !args.exercises || !Array.isArray(args.exercises)) {
            return { content: [{ type: "text", text: "Error: name y exercises válidos son obligatorios." }], isError: true };
        }

        const dbExercises = [];
        const notFound = [];

        for (const ex of args.exercises) {
            const found = await db.collection("exercices").findOne({ name: { $regex: new RegExp(ex.name, "i") } });
            if (found) {
                dbExercises.push({
                    exerciseId: found._id,
                    sets: ex.sets || 3,
                    reps: ex.reps || 10
                });
            } else {
                notFound.push(ex.name);
            }
        }

        const newRoutine = {
            userId: userObjectId,
            name: args.name,
            focus: args.focus || [],
            exercises: dbExercises,
            isSystemRoutine: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await db.collection("routines").insertOne(newRoutine);

        let msg = `Rutina '${args.name}' guardada de forma 100% nativa en la base de datos de GymTracker con éxito usando ${dbExercises.length} ejercicios validados.\n`;
        if (notFound.length > 0) {
            msg += `AVISO: Hubo ejercicios que LLAMA se inventó y no existen en el diccionario de la base de datos. Han sido purgados y eliminados de la rutina: ${notFound.join(', ')}. Recuerda al usuario que se han purgado.`;
        }

        return { content: [{ type: "text", text: msg }], isError: false };
    }

    static async updateUserRoutine(db, userObjectId, args) {
        if (!userObjectId) throw new Error("El userId es requerido para update_user_routine");
        if (!args.routineName || !args.exercises || !Array.isArray(args.exercises)) {
            return { content: [{ type: "text", text: "Error: routineName y exercises válidos son obligatorios." }], isError: true };
        }

        // Buscamos la rutina exacta del usuario
        const existingRoutine = await db.collection("routines").findOne({ userId: userObjectId, name: { $regex: new RegExp(`^${args.routineName}$`, "i") } });
        
        if (!existingRoutine) {
            return { content: [{ type: "text", text: `Error: No se encontró ninguna rutina llamada '${args.routineName}'. Dile al usuario que revise sus rutinas primero.` }], isError: true };
        }

        const dbExercises = [];
        const notFound = [];

        // Buscamos dinámicamente cada ejercicio que manda LLAMA
        for (const ex of args.exercises) {
            const found = await db.collection("exercices").findOne({ name: { $regex: new RegExp(ex.name, "i") } });
            if (found) {
                dbExercises.push({
                    exerciseId: found._id,
                    sets: ex.sets || 3,
                    reps: ex.reps || 10
                });
            } else {
                notFound.push(ex.name);
            }
        }

        const updateDoc = {
            exercises: dbExercises,
            updatedAt: new Date()
        };
        if (args.newName) updateDoc.name = args.newName; // Si Llama nos manda renombrarla

        // Hacemos un machaque seguro
        await db.collection("routines").updateOne({ _id: existingRoutine._id }, { $set: updateDoc });

        let msg = `Rutina '${args.routineName}' modificada y sobrescrita con éxito. Ahora cuenta con ${dbExercises.length} ejercicios.\n`;
        if (notFound.length > 0) {
            msg += `AVISO: Ciertos ejercicios introducidos fueron ignorados porque no existen en el diccionario de la base de datos: ${notFound.join(', ')}. Comunícalo al usuario.`;
        }

        return { content: [{ type: "text", text: msg }], isError: false };
    }

    static async searchFoodNutrition(query) {
        if (!query) throw new Error("Parámetro query es necesario para search_food_nutrition.");
        const apiKey = process.env.USDA_API_KEY;
        if (!apiKey) {
            return { content: [{ type: "text", text: "USDA_API_KEY secreta no está configurada en .env del MCP Server. Avisa al usuario de que el Dev debe ponerla."}], isError: true };
        }

        try {
            const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(query)}&pageSize=5&dataType=Foundation,SR%20Legacy,Branded`;
            const usdaResponse = await fetch(url);
            
            if (!usdaResponse.ok) return { content: [{ type: "text", text: `Error HTTP USDA API: ${usdaResponse.status}`}], isError: true };
            
            const data = await usdaResponse.json();
            const foods = data.foods || [];

            if (foods.length === 0) return { content: [{ type: "text", text: `No se encontraron macros para el alimento: ${query}.`}], isError: false };

            let msg = `Resultados USDA para '${query}':\n`;
            for (let i = 0; i < foods.length; i++) {
                const f = foods[i];
                const nutrients = f.foodNutrients || [];
                const getNut = (id) => { const n = nutrients.find(x => x.nutrientId === id); return n ? n.value : 0; };
                
                msg += `- ${f.description} (100g):\n`;
                msg += `  * Calorías: ${getNut(1008)} kcal\n`;
                msg += `  * Proteína: ${getNut(1003)} g\n`;
                msg += `  * Carbohidratos: ${getNut(1005)} g\n`;
                msg += `  * Grasa: ${getNut(1004)} g\n\n`;
            }
            return { content: [{ type: "text", text: msg }], isError: false };

        } catch (e) {
            return { content: [{ type: "text", text: `Fallo Fetch USDA API: ${e.message}`}], isError: true };
        }
    }

    static async calculateUserTDEE(db, userObjectId) {
        if (!userObjectId) throw new Error("userId requerido para TDEE.");
        const user = await db.collection("users").findOne({ _id: userObjectId });
        if (!user) return { content: [{ type: "text", text: "Error: Usuario no encontrado." }], isError: true };

        const weight = user.weight; // kg
        const height = user.height; // cm
        const age = user.age; // years

        if (!weight || !height || !age) {
            return { content: [{ type: "text", text: "Faltan datos en el perfil orgánico del usuario (peso, altura, edad) en la Base de Datos. Pídele al usuario que se pese y te lo diga para anotarlo." }], isError: false };
        }

        // Fórmulas Mifflin-St Jeor generalizadas
        // Hombre: (10 × peso) + (6.25 × altura) - (5 × edad) + 5
        // Mujer: (10 × peso) + (6.25 × altura) - (5 × edad) - 161
        // Como Mongoose no almacena sexo biológico actualmente en userModel, hacemos un promedio neutral BMR
        
        const bmrNeutral = (10 * weight) + (6.25 * height) - (5 * age) - 78;
        const sedentarismoTDEE = Math.round(bmrNeutral * 1.2);
        const actividadMediaTDEE = Math.round(bmrNeutral * 1.55);

        let msg = `Informe Metabólico Calculado Nativamente por el Servidor para un peso de ${weight}kg:\n`;
        msg += `- Metabolismo Basal (BMR promediado): ${Math.round(bmrNeutral)} kcal al día (supervivencia en coma).\n`;
        msg += `- Gasto Energético (TDEE) si es Sedentario: ~${sedentarismoTDEE} kcal/día.\n`;
        msg += `- Gasto Energético (TDEE) si entrena de 3 a 5 días medios: ~${actividadMediaTDEE} kcal/día.\n\n`;
        msg += `Si quiere perder grasa, resta 300-500 kcal al TDEE. Si quiere volumen, suma 300 kcal. Utiliza estos datos para tu discurso.`;

        return { content: [{ type: "text", text: msg }], isError: false };
    }

    static async getWorkoutStats(db, userObjectId) {
        if (!userObjectId) throw new Error("userId requerido para analíticas.");
        
        // Vamos a sacar agrupados los stats
        const workouts = await db.collection("workoutsessions")
            .find({ userId: userObjectId })
            .sort({ fecha: -1 })
            .toArray();

        if (workouts.length === 0) return { content: [{ type: "text", text: "Todavía no ha registrado ninguna sesión de gimnasio en GymTracker. Dile que es un vago y que tiene que entrenar!" }], isError: false };

        let totalVolumen = 0;
        let totalMinutos = 0;
        workouts.forEach(w => {
            totalVolumen += (w.volumen_total || 0);
            totalMinutos += (w.duracion_minutos || 0);
        });

        let msg = `Stats Consolidadas de Toda La Vida (${workouts.length} entrenamientos documentados):\n`;
        msg += `- Tiempo sudando la camiseta: ${totalMinutos} minutos totales en toda su cuenta.\n`;
        msg += `- Volumen movido: ${totalVolumen} kilos levantados en total.\n\n`;
        
        const lastW = workouts[0];
        msg += `Última sesión hecha fue: '${lastW.nombre_rutina}' quemando ${lastW.duracion_minutos || '?'} minutos. Utiliza este Big Data para darle perspectiva de su evolución y si es suficiente o poco estímulo.`;

        return { content: [{ type: "text", text: msg }], isError: false };
    }

    static async getUserPlates(db, userObjectId) {
        if (!userObjectId) throw new Error("userId requerido para get_user_plates.");
        const plates = await db.collection("plates").find({ userId: userObjectId }).toArray();
        
        if (plates.length === 0) return { content: [{ type: "text", text: "El usuario no tiene platos o recetas guardadas en su recetario personal." }], isError: false };
        
        let reply = "Recetario personal del usuario (Platos):\n";
        plates.forEach(p => {
            reply += `- ${p.name}: ${p.calories || 0} kcal (P: ${p.protein || 0}g, C: ${p.carbs || 0}g, G: ${p.fat || 0}g)\n`;
            if (p.ingredients) reply += `  * Ingredientes: ${p.ingredients.join(", ")}\n`;
        });
        return { content: [{ type: "text", text: reply }], isError: false };
    }

    static async getUserDiets(db, userObjectId) {
        if (!userObjectId) throw new Error("userId requerido para get_user_diets.");
        const diets = await db.collection("diets").find({ userId: userObjectId }).toArray();
        
        if (diets.length === 0) return { content: [{ type: "text", text: "El usuario no tiene planes nutricionales o dietas activas registradas." }], isError: false };
        
        let reply = "Planes nutricionales / Dietas del usuario:\n";
        diets.forEach(d => {
            reply += `- ${d.name} (${d.goal || 'Mantenimiento'}): Objetivo de ${d.targetCalories || 0} kcal diarias.\n`;
            if (d.description) reply += `  * Nota: ${d.description}\n`;
        });
        return { content: [{ type: "text", text: reply }], isError: false };
    }

    static async getNutritionSummary(db, userObjectId) {
        if (!userObjectId) throw new Error("userId requerido para get_nutrition_summary.");
        // Asumimos una colección 'nutritionlogs' o similar para el histórico
        const logs = await db.collection("nutritionlogs")
            .find({ userId: userObjectId })
            .sort({ date: -1 })
            .limit(7)
            .toArray();
            
        if (logs.length === 0) return { content: [{ type: "text", text: "No hay registros de consumo nutricional recientes en la base de datos." }], isError: false };
        
        let reply = "Resumen nutricional de los últimos 7 días:\n";
        logs.forEach(l => {
            reply += `- ${l.date}: ${l.consumedCalories} / ${l.targetCalories} kcal (Proteína: ${l.consumedProtein}g)\n`;
        });
        return { content: [{ type: "text", text: reply }], isError: false };
    }
}
