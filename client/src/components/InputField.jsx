import { Eye, EyeOff } from "lucide-react";

const InputField = ({ name, label, type = 'text', placeholder, icon: Icon, value, onChange, fieldErrors, showPass, setShowPass }) => {
    return (
    <div>
        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">{label}</label>
        <div className="relative">
            {Icon && <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />}
            <input
            type={type === 'password' ? (showPass ? 'text' : 'password') : type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            autoComplete={type === 'password' ? 'new-password' : name}
            className={`w-full ${Icon ? 'pl-9' : 'pl-4'} ${type === 'password' ? 'pr-10' : 'pr-4'} py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border ${
            fieldErrors[name]
                ? 'border-red-400 dark:border-red-600 focus:ring-red-400/40'
                : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/40 focus:border-indigo-500/60'
            } text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2`}
        />
        {type === 'password' && (
            <button type="button" onClick={() => setShowPass(p => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
        )}
        </div>
    {fieldErrors[name] && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{fieldErrors[name]}</p>}
    </div>
    );
};

export default InputField;