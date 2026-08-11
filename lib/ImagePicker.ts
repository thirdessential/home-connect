import * as ImagePicker from "expo-image-picker";
import { ActionSheetIOS, Alert, Platform } from "react-native";

export type PickImageOptions = {
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number; // 0..1
};

const defaultOpts: PickImageOptions = {
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.9,
};

async function ensureLibraryPermission() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return perm.status === "granted";
}

async function ensureCameraPermission() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    return perm.status === "granted";
}

export async function pickFromLibrary(
    opts: PickImageOptions = defaultOpts
): Promise<ImagePicker.ImagePickerAsset | null> {
    const ok = await ensureLibraryPermission();
    if (!ok) {
        Alert.alert("Permission needed", "Please allow Photos access to continue.");
        return null;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: opts.allowsEditing,
        aspect: opts.aspect,
        quality: opts.quality,
    });
    if (res.canceled) return null;
    return res.assets[0];
}

export async function takePhoto(
    opts: PickImageOptions = defaultOpts
): Promise<ImagePicker.ImagePickerAsset | null> {
    const ok = await ensureCameraPermission();
    if (!ok) {
        Alert.alert("Permission needed", "Please allow Camera access to continue.");
        return null;
    }
    const res = await ImagePicker.launchCameraAsync({
        allowsEditing: opts.allowsEditing,
        aspect: opts.aspect,
        quality: opts.quality,
    });
    if (res.canceled) return null;
    return res.assets[0];
}

/**
 * Show a platform menu and return the picked asset.
 * If allowRemove is true and user taps "Remove Photo", returns { removed: true } via the special shape below.
 */
export async function pickImageWithMenu(
    opts: PickImageOptions = defaultOpts,
    { allowRemove = false }: { allowRemove?: boolean } = {}
): Promise<{ asset?: ImagePicker.ImagePickerAsset; removed?: true } | null> {
    if (Platform.OS === "ios") {
        return new Promise((resolve) => {
            const options = [
                "Cancel",
                "Take Photo",
                "Choose from Library",
                ...(allowRemove ? ["Remove Photo"] : []),
            ];
            const cancelButtonIndex = 0;
            const destructiveButtonIndex = allowRemove ? options.length - 1 : undefined;

            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    cancelButtonIndex,
                    destructiveButtonIndex,
                    userInterfaceStyle: "light",
                },
                async (idx) => {
                    if (idx === 1) {
                        const asset = await takePhoto(opts);
                        resolve(asset ? { asset } : null);
                    } else if (idx === 2) {
                        const asset = await pickFromLibrary(opts);
                        resolve(asset ? { asset } : null);
                    } else if (allowRemove && idx === options.length - 1) {
                        resolve({ removed: true });
                    } else {
                        resolve(null);
                    }
                }
            );
        });
    } else {
        return new Promise((resolve) => {
            Alert.alert(
                "Profile picture",
                undefined,
                [
                    {
                        text: "Take Photo", onPress: async () => {
                            const asset = await takePhoto(opts);
                            resolve(asset ? { asset } : null);
                        }
                    },
                    {
                        text: "Choose from Library", onPress: async () => {
                            const asset = await pickFromLibrary(opts);
                            resolve(asset ? { asset } : null);
                        }
                    },
                    ...(allowRemove
                        ? [{ text: "Remove Photo", style: 'destructive' as 'destructive', onPress: () => resolve({ removed: true as const }) }]
                        : []),
                    { text: "Cancel", style: "cancel", onPress: () => resolve(null) },
                ],
                { cancelable: true }
            );
        });
    }
}
