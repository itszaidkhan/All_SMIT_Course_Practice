import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    updateDoc,
    where,
} from "firebase/firestore";
import { auth, db } from "../firbase.js";
import { useEffect, useState } from "react";
import { Trash, Check, Edit } from "lucide-react";
import { toast } from "sonner";

const TaskList = () => {
    const [tasks, setTasks] = useState([]);
    const [open, setOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        taskName: "",
        description: "",
        deadline: "",
    });

    useEffect(() => {
        const currentUser = auth.currentUser;
        const collectionRef = collection(db, "tasks");
        const q = query(collectionRef, where("userId", "==", currentUser?.uid));
        console.log(currentUser?.uid);
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const data = [];
            querySnapshot.forEach((docSnap) => {
                data.push({ ...docSnap.data(), id: docSnap.id });
            });
            setTasks(data);
        });
        return () => unsubscribe();
    }, []);

    const deleteTask = async (id) => {
        try {
            await deleteDoc(doc(db, "tasks", id));
            toast("Task has been deleted");
        } catch (error) {
            toast(error?.message);
        }
    };

    const markTaskComplete = async (id) => {
        try {
            await updateDoc(doc(db, "tasks", id), { status: "completed" });
            toast("Task marked as completed");
        } catch (error) {
            toast(error?.message);
        }
    };

    const openEdit = (task) => {
        setEditingTask(task);
        setForm({
            taskName: task.taskName || "",
            description: task.description || "",
            deadline: task.deadline || "",
        });
        setOpen(true);
    };

    const handleChange = (e) =>
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const updateTask = async () => {
        if (!editingTask) return;
        if (!form.taskName.trim()) return toast("Task name required");
        if (!form.deadline) return toast("Deadline required");

        setLoading(true);
        try {
            await updateDoc(doc(db, "tasks", editingTask.id), {
                taskName: form.taskName,
                description: form.description,
                deadline: form.deadline,
            });
            toast("Task updated");
            setOpen(false);
            setEditingTask(null);
        } catch (error) {
            toast(error?.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[60px]">#</TableHead>
                        <TableHead>Task Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tasks.map((task, index) => (
                        <TableRow key={task.id}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell>{task.taskName}</TableCell>
                            <TableCell>{task.description}</TableCell>
                            <TableCell>{task.deadline}</TableCell>
                            <TableCell>{task.status}</TableCell>
                            <TableCell className="flex gap-3 cursor-pointer">
                                {task.status === "pending" ? <Check
                                    size={16}
                                    className="cursor-pointer text-green-500"
                                    onClick={() => markTaskComplete(task.id)}
                                /> : "X"}
                                <Edit
                                    size={16}
                                    className="cursor-pointer"
                                    onClick={() => openEdit(task)}
                                />
                                <Trash
                                    size={16}
                                    className="cursor-pointer text-red-500"
                                    onClick={() => deleteTask(task.id)}
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Edit Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                        <DialogTitle>Edit Task</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <label className="text-sm">Task Name</label>
                            <Input
                                name="taskName"
                                value={form.taskName}
                                onChange={handleChange}
                                placeholder="Task name"
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm">Description</label>
                            <Textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                placeholder="Description"
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm">Deadline</label>
                            <Input
                                name="deadline"
                                type="date"
                                value={form.deadline}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={updateTask} disabled={loading}>
                            {loading ? "Saving..." : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default TaskList;
