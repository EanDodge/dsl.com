import { doc, getDoc, updateDoc, arrayRemove, deleteDoc } from "firebase/firestore"
import { auth, db } from "../firebase"
import { useAuth } from "../context/AuthContext"
import { useEffect, useState } from "react"
import { signOut } from "firebase/auth"


export default function Profile(){
    const {currentUser} = useAuth();
    const [profileData,setProfileData] = useState(null);
    const [formData,setFormData] = useState({});
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState("");
    useEffect(() =>{
        const fetchProfile = async () =>{
            const userSnap = await getDoc(doc(db, "users",currentUser.uid));
            if(userSnap.exists()){

                setProfileData(userSnap.data());
                setFormData(userSnap.data());
            }
            else{
                    // nav("/not-found");
                    return;
                }
        }
        fetchProfile();
    }, []);
    const isDirty = JSON.stringify(formData) !== JSON.stringify(profileData);

    const handleChange = (e) => {
        setFormData({...formData, [e.target.name]: e.target.value})
    }
    const handleSave = async() => {
        if (saving) return;
        setSaving(true);
        try {
            const {displayName,bio} = formData;
            await updateDoc(doc(db, "users", currentUser.uid),{displayName,bio} );
            setProfileData(formData);
            setSaveStatus("Profile saved.");
        } catch (err) {
            console.error(err);
            setSaveStatus("Save failed. Please try again.");
        } finally {
            setSaving(false);
            setTimeout(() => setSaveStatus(""), 3000);
        }
    }

    const handleDeleteAccount = async () => {
        if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
        try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            const leagueIds = userDoc.data().leagueIds || [];
            for (const lid of leagueIds) {
                await updateDoc(doc(db, 'leagues', lid), {
                    memberUids: arrayRemove(currentUser.uid)
                });
                await deleteDoc(doc(db, 'leagues', lid, 'players', currentUser.uid));
            }
            await deleteDoc(doc(db, 'users', currentUser.uid));
            await signOut(auth);
            window.location.href = '/login';
        } catch (error) {
            console.error(error);
        }
    };
    if (!profileData) return <div className="flex items-center justify-center h-screen"><p className="text-gray-500">Loading...</p></div>

    return(
        <div className="pt-20 pb-8 px-4 md:px-8 max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">Profile Settings</h1>

            <form className="space-y-8">
                {/* Display Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Display Name</label>
                    <input
                        type="text"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-gray-900" style={{ "--tw-ring-color": "#FF6B00" }}
                    />
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Email</label>
                    <p className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">{formData.email}</p>
                </div>

                {/* Bio */}
                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Bio</label>
                    <textarea
                        name="bio"
                        value={formData.bio || ""}
                        onChange={handleChange}
                        rows="4"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-gray-900 resize-none" style={{ "--tw-ring-color": "#FF6B00" }}
                    />
                </div>

                {/* Role */}
                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Role</label>
                    <p className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 font-medium">{formData.role}</p>
                </div>

                {/* Save Button */}
                {saveStatus && (
                    <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                        {saveStatus}
                    </p>
                )}
                {isDirty && (
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className={`w-full btn-primary transition-opacity opacity-100 animate-fadeIn ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                )}
            </form>

            <div className="border-t pt-8">
                <button onClick={handleDeleteAccount} className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete Account</button>
            </div>
        </div>
    )
}