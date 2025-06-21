from flask import Blueprint, request, jsonify
from github import Github
import os

github_bp = Blueprint('github', __name__)

@github_bp.route('/repositories', methods=['GET'])
def get_repositories():
    """Get list of repositories for authenticated user"""
    try:
        github_token = request.headers.get('Authorization')
        if not github_token:
            return jsonify({'error': 'GitHub token required'}), 401
        
        # Remove 'Bearer ' prefix if present
        if github_token.startswith('Bearer '):
            github_token = github_token[7:]
        
        g = Github(github_token)
        user = g.get_user()
        repos = []
        
        for repo in user.get_repos():
            repos.append({
                'id': repo.id,
                'name': repo.name,
                'full_name': repo.full_name,
                'description': repo.description,
                'private': repo.private,
                'html_url': repo.html_url,
                'language': repo.language,
                'updated_at': repo.updated_at.isoformat() if repo.updated_at else None
            })
        
        return jsonify({'repositories': repos})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@github_bp.route('/repository/<path:repo_name>/contents', methods=['GET'])
def get_repository_contents(repo_name):
    """Get contents of a repository"""
    try:
        github_token = request.headers.get('Authorization')
        if not github_token:
            return jsonify({'error': 'GitHub token required'}), 401
        
        # Remove 'Bearer ' prefix if present
        if github_token.startswith('Bearer '):
            github_token = github_token[7:]
        
        path = request.args.get('path', '')
        
        g = Github(github_token)
        repo = g.get_repo(repo_name)
        contents = repo.get_contents(path)
        
        if isinstance(contents, list):
            # Directory contents
            items = []
            for content in contents:
                items.append({
                    'name': content.name,
                    'path': content.path,
                    'type': content.type,
                    'size': content.size,
                    'sha': content.sha,
                    'download_url': content.download_url
                })
            return jsonify({'contents': items, 'type': 'directory'})
        else:
            # Single file
            file_content = contents.decoded_content.decode('utf-8') if contents.content else ''
            return jsonify({
                'name': contents.name,
                'path': contents.path,
                'type': contents.type,
                'size': contents.size,
                'sha': contents.sha,
                'content': file_content,
                'encoding': contents.encoding
            })
    
    except Exception as e:
        error_msg = str(e)
        if "401" in error_msg or "Bad credentials" in error_msg:
            return jsonify({'error': 'Invalid GitHub token. Please check your token and try again.'}), 401
        elif "404" in error_msg or "Not Found" in error_msg:
            return jsonify({'error': f'Repository "{repo_name}" not found or not accessible.'}), 404
        else:
            return jsonify({'error': f'GitHub API error: {error_msg}'}), 500

@github_bp.route('/repository/<path:repo_name>/file', methods=['GET'])
def get_file_content(repo_name):
    """Get specific file content from repository"""
    try:
        github_token = request.headers.get('Authorization')
        if not github_token:
            return jsonify({'error': 'GitHub token required'}), 401
        
        # Remove 'Bearer ' prefix if present
        if github_token.startswith('Bearer '):
            github_token = github_token[7:]
        
        file_path = request.args.get('path')
        if not file_path:
            return jsonify({'error': 'File path required'}), 400
        
        g = Github(github_token)
        repo = g.get_repo(repo_name)
        file_content = repo.get_contents(file_path)
        
        content = file_content.decoded_content.decode('utf-8')
        
        return jsonify({
            'name': file_content.name,
            'path': file_content.path,
            'content': content,
            'size': file_content.size,
            'sha': file_content.sha
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@github_bp.route('/repository/<path:repo_name>/analyze-all', methods=['POST'])
def analyze_all_files(repo_name):
    """Recursively analyze all files in a repository"""
    try:
        github_token = request.headers.get('Authorization')
        if not github_token:
            return jsonify({'error': 'GitHub token required'}), 401

        # Remove 'Bearer ' prefix if present
        if github_token.startswith('Bearer '):
            github_token = github_token[7:]

        data = request.get_json()
        file_extensions = data.get('extensions', ['.py', '.js', '.jsx', '.ts', '.tsx', '.java', '.cpp', '.c', '.cs'])
        max_files = data.get('max_files', 50)  # Limit to prevent overwhelming

        g = Github(github_token)
        repo = g.get_repo(repo_name)

        def get_all_files(contents, current_files=[]):
            if len(current_files) >= max_files:
                return current_files

            for content in contents:
                if len(current_files) >= max_files:
                    break

                if content.type == "file":
                    # Check if file extension is in our list
                    if any(content.name.endswith(ext) for ext in file_extensions):
                        try:
                            file_content = content.decoded_content.decode('utf-8')
                            current_files.append({
                                'name': content.name,
                                'path': content.path,
                                'content': file_content,
                                'size': content.size
                            })
                        except Exception:
                            # Skip files that can't be decoded
                            continue
                elif content.type == "dir":
                    # Recursively get files from subdirectory
                    try:
                        subdir_contents = repo.get_contents(content.path)
                        current_files = get_all_files(subdir_contents, current_files)
                    except Exception:
                        # Skip directories that can't be accessed
                        continue

            return current_files

        # Start from root
        root_contents = repo.get_contents("")
        all_files = get_all_files(root_contents)

        return jsonify({
            'files': all_files,
            'total_files': len(all_files),
            'repository': repo_name
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@github_bp.route('/repository/<path:repo_name>/create-pr', methods=['POST'])
def create_pull_request(repo_name):
    """Create a pull request with improved code"""
    try:
        github_token = request.headers.get('Authorization')
        if not github_token:
            return jsonify({'error': 'GitHub token required'}), 401

        # Remove 'Bearer ' prefix if present
        if github_token.startswith('Bearer '):
            github_token = github_token[7:]

        data = request.get_json()
        title = data.get('title', 'Code Improvements by AI Assistant')
        body = data.get('body', 'This pull request contains AI-suggested code improvements.')
        head = data.get('head')  # branch name
        base = data.get('base', 'main')

        if not head:
            return jsonify({'error': 'Head branch required'}), 400

        g = Github(github_token)
        repo = g.get_repo(repo_name)

        pr = repo.create_pull(
            title=title,
            body=body,
            head=head,
            base=base
        )

        return jsonify({
            'id': pr.id,
            'number': pr.number,
            'title': pr.title,
            'html_url': pr.html_url,
            'state': pr.state
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500
