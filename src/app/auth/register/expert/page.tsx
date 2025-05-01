import RegisterForm from "@/components/auth/RegisterForm";

export default function ExpertRegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gray-900">
          Expert Registration
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Create your expert account to review CVs and provide valuable feedback
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <RegisterForm userType="expert" />
      </div>
    </div>
  );
}
