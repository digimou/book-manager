"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useRegister } from "@/lib/hooks/use-auth";
import {
  useUsers,
  useUpdateUser,
  useChangePassword,
  type User,
} from "@/lib/hooks/use-users";
import { USER_ROLES, VALIDATION } from "@/lib/constants";
import {
  Shield,
  Users,
  UserPlus,
  Plus,
  Mail,
  Calendar,
  Edit,
  Key,
} from "lucide-react";
import toast from "react-hot-toast";

const createUserSchema = z.object({
  name: z
    .string()
    .min(VALIDATION.MIN_NAME_LENGTH, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(VALIDATION.MIN_PASSWORD_LENGTH, {
    message: "Password must be at least 6 characters",
  }),
  role: z.enum([USER_ROLES.USER, USER_ROLES.BOOKKEEPER, USER_ROLES.ADMIN]),
});

const updateUserSchema = z.object({
  name: z
    .string()
    .min(VALIDATION.MIN_NAME_LENGTH, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  role: z.enum([USER_ROLES.USER, USER_ROLES.BOOKKEEPER, USER_ROLES.ADMIN]),
});

const changePasswordSchema = z
  .object({
    password: z.string().min(VALIDATION.MIN_PASSWORD_LENGTH, {
      message: "Password must be at least 6 characters",
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type CreateUserData = z.infer<typeof createUserSchema>;
type UpdateUserData = z.infer<typeof updateUserSchema>;
type ChangePasswordData = z.infer<typeof changePasswordSchema>;

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [changingPasswordFor, setChangingPasswordFor] = useState<User | null>(
    null
  );

  const registerMutation = useRegister();
  const updateUserMutation = useUpdateUser();
  const changePasswordMutation = useChangePassword();
  const { data: users, isLoading, error: fetchError, refetch } = useUsers();

  const createForm = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: USER_ROLES.USER,
    },
  });

  const editForm = useForm<UpdateUserData>({
    resolver: zodResolver(updateUserSchema),
  });

  const passwordForm = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Check if user is admin or bookkeeper
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!session?.user) {
    router.push("/auth/login");
    return null;
  }

  const userRole = (session.user as { role: string }).role;
  const isAdmin = userRole === USER_ROLES.ADMIN;
  const isBookkeeper = userRole === USER_ROLES.BOOKKEEPER;

  if (!isAdmin && !isBookkeeper) {
    router.push("/dashboard");
    return null;
  }

  const handleCreateUser = async (data: CreateUserData) => {
    try {
      await registerMutation.mutateAsync(data);
      toast.success("User created successfully!");
      createForm.reset();
      setIsModalOpen(false);
      refetch(); // Refresh the users list
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create user"
      );
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    editForm.reset({
      name: user.name,
      email: user.email,
      role: user.role as "ADMIN" | "BOOKKEEPER" | "USER",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (data: UpdateUserData) => {
    if (!editingUser) return;

    try {
      await updateUserMutation.mutateAsync({
        id: editingUser.id,
        data,
      });
      toast.success("User updated successfully!");
      setIsEditModalOpen(false);
      setEditingUser(null);
      editForm.reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update user"
      );
    }
  };

  const handleChangePassword = (user: User) => {
    setChangingPasswordFor(user);
    passwordForm.reset({
      password: "",
      confirmPassword: "",
    });
    setIsPasswordModalOpen(true);
  };

  const handlePasswordChange = async (data: ChangePasswordData) => {
    if (!changingPasswordFor) return;

    try {
      await changePasswordMutation.mutateAsync({
        id: changingPasswordFor.id,
        data: { password: data.password },
      });
      toast.success("Password changed successfully!");
      setIsPasswordModalOpen(false);
      setChangingPasswordFor(null);
      passwordForm.reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to change password"
      );
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return "destructive";
      case USER_ROLES.BOOKKEEPER:
        return "default";
      case USER_ROLES.USER:
        return "secondary";
      default:
        return "outline";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              {isAdmin ? "User Management" : "Bookkeeper Directory"}
            </h1>
          </div>
          {isAdmin && (
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Create New User
                  </DialogTitle>
                  <DialogDescription>
                    Add a new user to the system. Only administrators can create
                    users.
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={createForm.handleSubmit(handleCreateUser)}
                  className="space-y-4"
                >
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Name
                    </label>
                    <Input
                      id="name"
                      type="text"
                      {...createForm.register("name")}
                      className="mt-1"
                      placeholder="Enter user's full name"
                    />
                    {createForm.formState.errors.name && (
                      <p className="mt-1 text-sm text-red-600">
                        {createForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      {...createForm.register("email")}
                      className="mt-1"
                      placeholder="Enter user's email address"
                    />
                    {createForm.formState.errors.email && (
                      <p className="mt-1 text-sm text-red-600">
                        {createForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Password
                    </label>
                    <Input
                      id="password"
                      type="password"
                      {...createForm.register("password")}
                      className="mt-1"
                      placeholder="Enter initial password"
                    />
                    {createForm.formState.errors.password && (
                      <p className="mt-1 text-sm text-red-600">
                        {createForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="role"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Role
                    </label>
                    <select
                      id="role"
                      {...createForm.register("role")}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value={USER_ROLES.USER}>User</option>
                      <option value={USER_ROLES.BOOKKEEPER}>Bookkeeper</option>
                      <option value={USER_ROLES.ADMIN}>Admin</option>
                    </select>
                    {createForm.formState.errors.role && (
                      <p className="mt-1 text-sm text-red-600">
                        {createForm.formState.errors.role.message}
                      </p>
                    )}
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={registerMutation.isPending}>
                      {registerMutation.isPending
                        ? "Creating user..."
                        : "Create User"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Only administrators can view and manage users in the system.
          </AlertDescription>
        </Alert>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : fetchError ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-red-600 mb-4">
                  Failed to load users. Please try again.
                </p>
                <Button onClick={() => refetch()}>Retry</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users?.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{user.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role}
                      </Badge>
                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleChangePassword(user)}
                            className="h-8 w-8 p-0"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {formatDate(user.createdAt)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {users && users.length === 0 && !isLoading && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No users found
                </h3>
                <p className="text-gray-600">
                  {isAdmin
                    ? "Get started by creating your first user."
                    : "No other bookkeepers found in the system."}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit User Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Edit User
              </DialogTitle>
              <DialogDescription>
                Update user information. Only administrators can edit users.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={editForm.handleSubmit(handleUpdateUser)}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="edit-name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Name
                </label>
                <Input
                  id="edit-name"
                  type="text"
                  {...editForm.register("name")}
                  className="mt-1"
                  placeholder="Enter user's full name"
                />
                {editForm.formState.errors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {editForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="edit-email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <Input
                  id="edit-email"
                  type="email"
                  {...editForm.register("email")}
                  className="mt-1"
                  placeholder="Enter user's email address"
                />
                {editForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {editForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="edit-role"
                  className="block text-sm font-medium text-gray-700"
                >
                  Role
                </label>
                <select
                  id="edit-role"
                  {...editForm.register("role")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value={USER_ROLES.USER}>User</option>
                  <option value={USER_ROLES.BOOKKEEPER}>Bookkeeper</option>
                  <option value={USER_ROLES.ADMIN}>Admin</option>
                </select>
                {editForm.formState.errors.role && (
                  <p className="mt-1 text-sm text-red-600">
                    {editForm.formState.errors.role.message}
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingUser(null);
                    editForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending
                    ? "Updating user..."
                    : "Update User"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Change Password Modal */}
        <Dialog
          open={isPasswordModalOpen}
          onOpenChange={setIsPasswordModalOpen}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Change Password
              </DialogTitle>
              <DialogDescription>
                Change password for {changingPasswordFor?.name}. Only
                administrators can change user passwords.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={passwordForm.handleSubmit(handlePasswordChange)}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-sm font-medium text-gray-700"
                >
                  New Password
                </label>
                <Input
                  id="new-password"
                  type="password"
                  {...passwordForm.register("password")}
                  className="mt-1"
                  placeholder="Enter new password"
                />
                {passwordForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {passwordForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm Password
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  {...passwordForm.register("confirmPassword")}
                  className="mt-1"
                  placeholder="Confirm new password"
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setChangingPasswordFor(null);
                    passwordForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                >
                  {changePasswordMutation.isPending
                    ? "Changing password..."
                    : "Change Password"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
