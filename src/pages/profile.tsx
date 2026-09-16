import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Camera, Trash2, Edit3 } from "lucide-react";
import toast from "react-hot-toast";

import Layout from "@/_components/Layout";
import { useAppDispatch, useAppSelector } from "@/_redux/store";
import { profileAction } from "@/_redux/actions/profile.action";
import { profileSchema, ProfileFormData } from "@/_validations/profile";
import Card from "@/_UI/Card";
import Input from "@/_UI/Input";
import Button from "@/_UI/Button";
import PageLoader from "@/_UI/PageLoader";
import AuthPrompt from "@/_UI/AuthPrompt";

const Profile = () => {
	const router = useRouter();
	const dispatch = useAppDispatch();
	const { isAuthenticated } = useAppSelector((state) => state.auth);
	const { profile, isLoading, isUpdating } = useAppSelector((state) => state.profile);
	const [isEditing, setIsEditing] = useState(false);
	const [showAuthPrompt, setShowAuthPrompt] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<ProfileFormData>({
		resolver: zodResolver(profileSchema),
	});

	useEffect(() => {
		if (!isAuthenticated) {
			setShowAuthPrompt(true);
			return;
		}
		dispatch(profileAction.fetchProfileAsync());
	}, [dispatch, isAuthenticated, router]);

	useEffect(() => {
		if (profile) {
			reset({
				firstName: profile.firstName || "",
				lastName: profile.lastName || "",
				phoneNumber: profile.phoneNumber || "",
				gender: profile.gender || "",
			});
		}
	}, [profile, reset]);

	const onSubmit = async (data: ProfileFormData) => {
		try {
			await dispatch(profileAction.updateProfileAsync(data)).unwrap();
			toast.success("Profile updated successfully!");
			setIsEditing(false);
		} catch (error: any) {
			toast.error(error || "Failed to update profile");
		}
	};

	const handleUploadPhoto = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const formData = new FormData();
		formData.append("file", file);

		try {
			await dispatch(profileAction.uploadProfilePictureAsync(formData)).unwrap();
			toast.success("Profile picture updated!");
		} catch (error: any) {
			toast.error(error || "Failed to upload picture");
		}

		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleRemovePhoto = async () => {
		try {
			await dispatch(profileAction.deleteProfilePictureAsync()).unwrap();
			toast.success("Profile picture removed!");
		} catch (error: any) {
			toast.error(error || "Failed to remove picture");
		}
	};

	if (!isAuthenticated) {
		return (
			<Layout pageTitle="Profile">
				<AuthPrompt
					isOpen={showAuthPrompt}
					onClose={() => router.push("/products")}
					redirectTo={router.asPath}
					title="Sign in to manage profile"
					message="Log in to view and update your personal information."
				/>
			</Layout>
		);
	}

	if (isLoading && !profile) {
		return (
			<Layout pageTitle="Profile">
				<PageLoader fullScreen={false} message="Loading profile..." />
			</Layout>
		);
	}

	return (
		<Layout pageTitle="Profile">
			<div className="container page-wrapper mx-auto px-4 py-8 max-w-3xl">
				{/* Profile Header */}
				<Card elevation={1} padding="lg" className="mb-8">
					<div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
						{/* Profile Picture */}
						<div className="relative">
							{profile?.profileImage?.url ? (
								<img
									src={profile.profileImage.url}
									alt="Profile"
									className="w-24 h-24 rounded-full object-cover border-4 border-primary-100 dark:border-primary-900/50"
								/>
							) : (
								<div className="w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center border-4 border-primary-200 dark:border-primary-800">
									<User className="h-12 w-12 text-primary-600 dark:text-primary-400" />
								</div>
							)}
						</div>

						{/* Name and Email */}
						<div className="text-center sm:text-left flex-1">
							<h1 className="text-2xl font-bold text-on-surface dark:text-white">
								{profile?.firstName} {profile?.lastName}
							</h1>
							<p className="text-on-surface-variant dark:text-gray-400">{profile?.email}</p>
						</div>
					</div>

					{/* Photo Actions */}
					<div className="flex items-center justify-center sm:justify-start space-x-3 mt-6">
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							onChange={handleFileChange}
							className="hidden"
						/>
						<Button
							variant="filled"
							size="sm"
							leftIcon={Camera}
							onClick={handleUploadPhoto}
							disabled={isUpdating}
						>
							Upload Photo
						</Button>
						{profile?.profileImage?.url && (
							<Button
								variant="outlined"
								color="error"
								size="sm"
								leftIcon={Trash2}
								onClick={handleRemovePhoto}
								disabled={isUpdating}
							>
								Remove Photo
							</Button>
						)}
					</div>
				</Card>

				{/* Profile Info */}
				<Card elevation={1} padding="lg">
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-xl font-semibold text-on-surface dark:text-white">Profile Information</h2>
						{!isEditing && (
							<Button
								variant="text"
								size="sm"
								leftIcon={Edit3}
								onClick={() => setIsEditing(true)}
							>
								Edit Profile
							</Button>
						)}
					</div>

					{isEditing ? (
						<form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
								<Input
									label="First Name"
									{...register("firstName")}
									type="text"
									error={errors.firstName?.message}
								/>
								<Input
									label="Last Name"
									{...register("lastName")}
									type="text"
									error={errors.lastName?.message}
								/>
							</div>

							<Input
								label="Phone Number"
								{...register("phoneNumber")}
								type="text"
								placeholder="e.g. +234 800 000 0000"
							/>

							<div>
								<label className="block text-sm font-medium text-on-surface/80 dark:text-gray-200 mb-1.5">
									Gender
								</label>
								<select
									{...register("gender")}
									className="w-full border rounded-radius-md px-3 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-colors"
									style={{ borderColor: "var(--border-light)", color: "var(--text-primary)" }}
								>
									<option value="">Select gender</option>
									<option value="Male">Male</option>
									<option value="Female">Female</option>
									<option value="Other">Other</option>
								</select>
							</div>

							<div className="flex items-center space-x-3 pt-2">
								<Button
									type="submit"
									variant="filled"
									loading={isUpdating}
									disabled={isUpdating}
								>
									{isUpdating ? "Saving..." : "Save Changes"}
								</Button>
								<Button
									type="button"
									variant="outlined"
									color="secondary"
									onClick={() => {
										setIsEditing(false);
										if (profile) {
											reset({
												firstName: profile.firstName || "",
												lastName: profile.lastName || "",
												phoneNumber: profile.phoneNumber || "",
												gender: profile.gender || "",
											});
										}
									}}
								>
									Cancel
								</Button>
							</div>
						</form>
					) : (
						<div className="space-y-4">
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<p className="text-sm text-on-surface-variant dark:text-gray-400">First Name</p>
									<p className="text-on-surface dark:text-white font-medium">{profile?.firstName || "-"}</p>
								</div>
								<div>
									<p className="text-sm text-on-surface-variant dark:text-gray-400">Last Name</p>
									<p className="text-on-surface dark:text-white font-medium">{profile?.lastName || "-"}</p>
								</div>
							</div>
							<div>
								<p className="text-sm text-on-surface-variant dark:text-gray-400">Email</p>
								<p className="text-on-surface dark:text-white font-medium">{profile?.email || "-"}</p>
							</div>
							<div>
								<p className="text-sm text-on-surface-variant dark:text-gray-400">Phone Number</p>
								<p className="text-on-surface dark:text-white font-medium">{profile?.phoneNumber || "-"}</p>
							</div>
							<div>
								<p className="text-sm text-on-surface-variant dark:text-gray-400">Gender</p>
								<p className="text-on-surface dark:text-white font-medium">{profile?.gender || "-"}</p>
							</div>
						</div>
					)}
				</Card>
			</div>
		</Layout>
	);
};

export default Profile;
