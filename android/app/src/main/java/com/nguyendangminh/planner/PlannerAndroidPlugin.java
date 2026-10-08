package com.nguyendangminh.planner;
import android.Manifest;
import android.appwidget.AppWidgetManager;
import android.content.*;
import android.os.*;
import android.net.Uri;
import android.provider.Settings;
import androidx.credentials.*;
import androidx.credentials.exceptions.GetCredentialException;
import androidx.core.content.ContextCompat;
import com.getcapacitor.*;
import com.getcapacitor.annotation.*;
import com.google.android.libraries.identity.googleid.*;
import com.google.firebase.auth.*;
import org.json.*;

@CapacitorPlugin(name="PlannerAndroid",permissions={@Permission(alias="notifications",strings={Manifest.permission.POST_NOTIFICATIONS})})
public class PlannerAndroidPlugin extends Plugin {
    @PluginMethod public void googleSignIn(PluginCall call){
        int resource=getContext().getResources().getIdentifier("default_web_client_id","string",getContext().getPackageName());
        String client=resource==0?"":getContext().getString(resource);
        if(client.trim().isEmpty()){call.reject("Bản Android chưa được đăng ký Google sign-in trong Firebase. Cần google-services.json và SHA-1 của APK.","ANDROID_GOOGLE_SETUP");return;}
        PlannerStore.firebase(getContext());
        GetSignInWithGoogleOption option=new GetSignInWithGoogleOption.Builder(client).build();
        GetCredentialRequest request=new GetCredentialRequest.Builder().addCredentialOption(option).build();
        getActivity().runOnUiThread(()->CredentialManager.create(getContext()).getCredentialAsync(getActivity(),request,new CancellationSignal(),ContextCompat.getMainExecutor(getContext()),new CredentialManagerCallback<GetCredentialResponse,GetCredentialException>(){
            @Override public void onResult(GetCredentialResponse result){
                try{
                    Credential credential=result.getCredential();
                    if(!(credential instanceof CustomCredential)||!GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(credential.getType()))throw new IllegalArgumentException("Không nhận được tài khoản Google.");
                    String token=GoogleIdTokenCredential.createFrom(credential.getData()).getIdToken();
                    FirebaseAuth.getInstance().signInWithCredential(GoogleAuthProvider.getCredential(token,null)).addOnSuccessListener(value->{JSObject data=new JSObject();data.put("idToken",token);call.resolve(data);}).addOnFailureListener(error->call.reject("Google sign-in chưa hoàn tất. Kiểm tra Firebase và SHA-1 của APK.","ANDROID_GOOGLE_AUTH"));
                }catch(Exception e){call.reject("Không nhận được tài khoản Google.","ANDROID_GOOGLE_AUTH");}
            }
            @Override public void onError(GetCredentialException error){call.reject("Chưa đăng nhập Google. Chọn tài khoản hoặc thử lại.","ANDROID_GOOGLE_AUTH");}
        }));
    }
    @PluginMethod public void syncAgenda(PluginCall call){
        String owner=call.getString("ownerId","");boolean demo=Boolean.TRUE.equals(call.getBoolean("demo",false));
        PlannerStore.firebase(getContext());var user=FirebaseAuth.getInstance().getCurrentUser();
        if(owner.isEmpty()||(demo&&!owner.equals("demo-user"))||(!demo&&(user==null||!owner.equals(user.getUid())))){call.reject("Tài khoản Android chưa đồng bộ đăng nhập.");return;}
        try{JSONObject data=new JSONObject().put("events",call.getArray("events",new JSArray())).put("tasks",call.getArray("tasks",new JSArray()));PlannerStore.save(getContext(),owner,data);call.resolve();}catch(Exception e){call.reject("Không lưu được lịch Android.");}
    }
    @PluginMethod public void clearSession(PluginCall call){PlannerStore.clear(getContext());CredentialManager.create(getContext()).clearCredentialStateAsync(new ClearCredentialStateRequest(),null,ContextCompat.getMainExecutor(getContext()),new CredentialManagerCallback<Void,androidx.credentials.exceptions.ClearCredentialException>(){@Override public void onResult(Void unused){call.resolve();}@Override public void onError(androidx.credentials.exceptions.ClearCredentialException error){call.resolve();}});}
    @PluginMethod public void getSettings(PluginCall call){
        try{JSObject result=new JSObject();result.put("settings",new JSObject(PlannerStore.settings(getContext()).toString()));JSObject status=new JSObject();status.put("notifications",PlannerNotifications.allowed(getContext()));status.put("exactAlarms",PlannerNotifications.exact(getContext()));status.put("updatedAt",PlannerStore.updated(getContext()));result.put("status",status);call.resolve(result);}catch(JSONException e){call.reject("Không đọc được cài đặt.");}
    }
    @PluginMethod public void updateSettings(PluginCall call){JSObject settings=call.getObject("settings");if(settings==null){call.reject("Thiếu cài đặt.");return;}PlannerStore.saveSettings(getContext(),settings);call.resolve();}
    @PluginMethod public void requestNotifications(PluginCall call){if(Build.VERSION.SDK_INT<33){call.resolve();return;}requestPermissionForAlias("notifications",call,"notificationResult");}
    @PermissionCallback private void notificationResult(PluginCall call){PlannerNotifications.reconcile(getContext());call.resolve();}
    @PluginMethod public void openExactAlarmSettings(PluginCall call){if(Build.VERSION.SDK_INT>=31)getActivity().startActivity(new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,Uri.parse("package:"+getContext().getPackageName())));call.resolve();}
    @PluginMethod public void openNotificationSettings(PluginCall call){getActivity().startActivity(new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE,getContext().getPackageName()));call.resolve();}
    @PluginMethod public void openReminderSoundSettings(PluginCall call){PlannerNotifications.channels(getContext());getActivity().startActivity(new Intent(Settings.ACTION_CHANNEL_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE,getContext().getPackageName()).putExtra(Settings.EXTRA_CHANNEL_ID,PlannerNotifications.soundChannel(call.getString("soundMode","ringtone"))));call.resolve();}
    @PluginMethod public void testReminder(PluginCall call){try{PlannerNotifications.test(getContext(),call.getString("soundMode","ringtone"));JSObject result=new JSObject();result.put("exact",PlannerNotifications.exact(getContext()));call.resolve(result);}catch(Exception e){call.reject(e.getMessage());}}
    @PluginMethod public void pinWidget(PluginCall call){AppWidgetManager manager=AppWidgetManager.getInstance(getContext());if(!manager.isRequestPinAppWidgetSupported()){call.reject("Nhấn giữ màn hình chính → Widgets → Planner để thêm.");return;}manager.requestPinAppWidget(new ComponentName(getContext(),PlannerWidget.class),null,null);call.resolve();}
    @PluginMethod public void consumeOpenRecord(PluginCall call){JSObject data=new JSObject();String key=getActivity().getIntent().getStringExtra("recordKey");if(key!=null){data.put("key",key);getActivity().getIntent().removeExtra("recordKey");}call.resolve(data);}
    @Override protected void handleOnNewIntent(Intent intent){String key=intent.getStringExtra("recordKey");if(key!=null){JSObject data=new JSObject();data.put("key",key);notifyListeners("openRecord",data);}}
    @Override protected void handleOnResume(){PlannerNotifications.reconcile(getContext());PlannerWidget.updateAll(getContext());}
}

