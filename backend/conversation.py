conversation_history=[]

def add_message(role,message):
    conversation_history.append({
        "role":role,
        "message":message
    })

def get_history():
    return conversation_history

def clear_history():
    conversation_history.clear()